import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AccessTokenExpired } from 'src/exceptions/auth.exception';
import {
  OneTimeLinkAccessDeniedException,
  OneTimeLinkAliasGenerationFailedException,
  OneTimeLinkInvalidPasswordException,
  OneTimeLinkNotFoundException,
  OneTimeLinkPasswordRequiredException,
} from 'src/exceptions/one-time-link.exception';
import { JwtPayload } from 'src/interfaces/auth.interface';
import {
  OneTimeLink,
  OneTimeLinkDocument,
  OneTimeLinkStatus,
} from 'src/models/one-time-link.schema';
import { User, UserDocument } from 'src/models/user.schema';
import { comparePassword, hashPassword } from 'src/utils/auth.utils';
import { generateRandomAlias } from '../utils/alias-helper.utils';
import {
  isDuplicateKeyError,
  normalizeHttpUrl,
  toObjectId,
} from '../utils/common.utils';
import {
  ONE_TIME_LINK_ALIAS_GENERATION_ATTEMPTS,
  ONE_TIME_LINK_ALIAS_LENGTH,
} from './one-time-link.constants';
import {
  CreateOneTimeLinkDto,
  GetPaginatedOneTimeLinksDto,
} from './dto/one-time-link.dto';

type SerializedOneTimeLink = {
  id: string;
  alias: string;
  originalUrl: string;
  oneTimeUrl: string;
  status: OneTimeLinkStatus;
  usedAt: Date | null;
  createdAt: Date | null;
  updatedAt: Date | null;
  passwordProtected: boolean;
};

type OneTimeLinkAnalyticsSummary = {
  total: number;
  protected: number;
  used: number;
  notUsed: number;
};

@Injectable()
export class OneTimeLinkService {
  constructor(
    @InjectModel(OneTimeLink.name)
    private readonly oneTimeLinkModel: Model<OneTimeLinkDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly configService: ConfigService,
  ) {}

  async createOneTimeLink(user: JwtPayload, dto: CreateOneTimeLinkDto) {
    const userId = await this.getAuthenticatedUserId(user);
    const originalUrl = normalizeHttpUrl({
      value: dto.originalUrl,
      fieldName: 'URL',
    });
    const passwordProtected = dto.passwordProtect === true;

    for (let i = 0; i < ONE_TIME_LINK_ALIAS_GENERATION_ATTEMPTS; i += 1) {
      const alias = generateRandomAlias(ONE_TIME_LINK_ALIAS_LENGTH);

      try {
        const oneTimeLink = await this.oneTimeLinkModel.create({
          userId,
          originalUrl,
          alias,
          status: OneTimeLinkStatus.ACTIVE,
          passwordProtected,
          passwordHash: passwordProtected
            ? await hashPassword(dto.password as string, 10)
            : null,
        });

        return {
          message: 'One-time link created successfully',
          oneTimeLink: this.serializeOneTimeLink(oneTimeLink),
        };
      } catch (error) {
        if (isDuplicateKeyError(error)) {
          continue;
        }

        throw error;
      }
    }

    throw new OneTimeLinkAliasGenerationFailedException();
  }

  async getPaginatedData(user: JwtPayload, query: GetPaginatedOneTimeLinksDto) {
    const userId = await this.getAuthenticatedUserId(user);
    const limit = query.limit;
    const currentPage = query.page;
    const cursorId = query.cursor
      ? toObjectId(query.cursor, 'Cursor id is invalid')
      : null;
    const skip = cursorId ? 0 : (currentPage - 1) * limit;
    const baseFilter = {
      userId,
      status: { $ne: OneTimeLinkStatus.DELETED },
    };

    const [oneTimeLinks, total] = await Promise.all([
      this.oneTimeLinkModel
        .find({
          ...baseFilter,
          ...(cursorId ? { _id: { $lt: cursorId } } : {}),
        })
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit + 1)
        .exec(),
      this.oneTimeLinkModel.countDocuments(baseFilter).exec(),
    ]);

    const hasMore = oneTimeLinks.length > limit;
    const items = (hasMore ? oneTimeLinks.slice(0, limit) : oneTimeLinks).map(
      (oneTimeLink) => this.serializeOneTimeLink(oneTimeLink),
    );
    const nextCursor = items.length > 0 ? items[items.length - 1].id : null;

    return {
      items,
      pagination: {
        totalItems: total,
        totalPages: Math.ceil(total / limit),
        hasMore,
        page: currentPage,
        limit,
        cursor: nextCursor,
      },
    };
  }

  async getOneTimeLinkAnalytics(
    user: JwtPayload,
  ): Promise<OneTimeLinkAnalyticsSummary> {
    const userId = await this.getAuthenticatedUserId(user);
    const [total, protectedCount, used, notUsed] = await Promise.all([
      this.oneTimeLinkModel.countDocuments({
        userId,
        status: { $ne: OneTimeLinkStatus.DELETED },
      }),
      this.oneTimeLinkModel.countDocuments({
        userId,
        status: { $ne: OneTimeLinkStatus.DELETED },
        passwordProtected: true,
      }),
      this.oneTimeLinkModel.countDocuments({
        userId,
        status: OneTimeLinkStatus.USED,
      }),
      this.oneTimeLinkModel.countDocuments({
        userId,
        status: OneTimeLinkStatus.ACTIVE,
      }),
    ]);

    return {
      total,
      protected: protectedCount,
      used,
      notUsed,
    };
  }

  async deleteOneTimeLink(user: JwtPayload, oneTimeLinkId: string) {
    const userId = await this.getAuthenticatedUserId(user);
    const oneTimeLink = await this.getOwnedOneTimeLink(userId, oneTimeLinkId);

    oneTimeLink.status = OneTimeLinkStatus.DELETED;
    oneTimeLink.deletedAt = new Date();
    await oneTimeLink.save();

    return {
      message: 'One-time link deleted successfully',
      deleted: true,
      oneTimeLink: this.serializeOneTimeLink(oneTimeLink),
    };
  }

  async resolveOneTimeLink(aliasParam: string, password?: string) {
    const alias = aliasParam.trim().toLowerCase();
    const oneTimeLink = await this.oneTimeLinkModel
      .findOne({
        alias,
        status: OneTimeLinkStatus.ACTIVE,
      })
      .exec();

    if (!oneTimeLink) {
      throw new OneTimeLinkNotFoundException();
    }

    if (oneTimeLink.passwordProtected) {
      if (!password) {
        throw new OneTimeLinkPasswordRequiredException();
      }

      const isPasswordValid = await comparePassword(
        password,
        oneTimeLink.passwordHash ?? '',
      );

      if (!isPasswordValid) {
        throw new OneTimeLinkInvalidPasswordException();
      }
    }

    const consumedAt = new Date();
    const consumedLink = await this.oneTimeLinkModel
      .findOneAndUpdate(
        {
          _id: oneTimeLink._id,
          status: OneTimeLinkStatus.ACTIVE,
        },
        {
          $set: {
            status: OneTimeLinkStatus.USED,
            usedAt: consumedAt,
          },
        },
        { new: true },
      )
      .exec();

    if (!consumedLink) {
      throw new OneTimeLinkNotFoundException();
    }

    return consumedLink.originalUrl;
  }

  private buildOneTimeUrl(alias: string): string {
    const backendUrl = this.configService
      .getOrThrow<string>('BACKEND_URL')
      .replace(/\/+$/, '');
    const publicBaseUrl = backendUrl.replace(/\/v1$/, '');

    return `${publicBaseUrl}/ot/${alias}`;
  }

  private serializeOneTimeLink(
    oneTimeLink: OneTimeLinkDocument,
  ): SerializedOneTimeLink {
    return {
      id: String(oneTimeLink._id),
      alias: oneTimeLink.alias,
      originalUrl: oneTimeLink.originalUrl,
      oneTimeUrl: this.buildOneTimeUrl(oneTimeLink.alias),
      status: oneTimeLink.status,
      usedAt: oneTimeLink.usedAt ?? null,
      createdAt: oneTimeLink.createdAt ?? null,
      updatedAt: oneTimeLink.updatedAt ?? null,
      passwordProtected: oneTimeLink.passwordProtected,
    };
  }

  private async getAuthenticatedUserId(
    user: JwtPayload,
  ): Promise<Types.ObjectId> {
    const userId = toObjectId(user.sub, 'Authenticated user id is invalid');
    const userExists = await this.userModel.exists({ _id: userId });

    if (!userExists) {
      throw new AccessTokenExpired();
    }

    return userId;
  }

  private async getOwnedOneTimeLink(
    userId: Types.ObjectId,
    oneTimeLinkId: string,
  ): Promise<OneTimeLinkDocument> {
    const id = toObjectId(oneTimeLinkId, 'One-time link id is invalid');
    const oneTimeLink = await this.oneTimeLinkModel.findById(id).exec();

    if (!oneTimeLink || oneTimeLink.status === OneTimeLinkStatus.DELETED) {
      throw new OneTimeLinkNotFoundException();
    }

    if (String(oneTimeLink.userId) !== String(userId)) {
      throw new OneTimeLinkAccessDeniedException();
    }

    return oneTimeLink;
  }
}

import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { lookup } from 'dns/promises';
import { isIP } from 'net';
import { Model, Types } from 'mongoose';
import { AccessTokenExpired } from 'src/exceptions/auth.exception';
import {
  LinkExpanderAlreadyExistsException,
  LinkExpanderAccessDeniedException,
  LinkExpanderDuplicateRequestException,
  LinkExpanderNotFoundException,
  LinkExpansionFailedException,
} from 'src/exceptions/link-expander.exception';
import { JwtPayload } from 'src/interfaces/auth.interface';
import {
  LinkExpander,
  LinkExpanderDocument,
  LinkExpanderLookupStatus,
} from 'src/models/link-expander.schema';
import { User, UserDocument } from 'src/models/user.schema';
import {
  isDuplicateKeyError,
  normalizeHttpUrl,
  toObjectId,
} from '../utils/common.utils';
import {
  ExpandLinkDto,
  GetPaginatedExpandedLinksDto,
} from './dto/link-expander.dto';
import {
  DEFAULT_LINK_EXPANDER_PAGE_LIMIT,
  LINK_EXPANDER_MAX_REDIRECTS,
  LINK_EXPANDER_TIMEOUT_MS,
} from './link-expander.constants';

type SerializedExpandedLink = {
  id: string;
  url: string;
  destinationUrl: string;
  status: LinkExpanderLookupStatus;
  redirectCount: number;
  errorMessage: string | null;
  createdAt: Date | null;
  updatedAt: Date | null;
};

@Injectable()
export class LinkExpanderService {
  constructor(
    @InjectModel(LinkExpander.name)
    private readonly linkExpanderModel: Model<LinkExpanderDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async expandLink(user: JwtPayload, dto: ExpandLinkDto) {
    const userId = await this.getAuthenticatedUserId(user);
    const url = normalizeHttpUrl({
      value: dto.url,
      fieldName: 'URL',
    });
    const existingExpandedLink = await this.linkExpanderModel
      .exists({
        userId,
        url,
        status: { $ne: LinkExpanderLookupStatus.DELETED },
      })
      .exec();

    if (existingExpandedLink) {
      throw new LinkExpanderDuplicateRequestException();
    }

    const expansion = await this.resolveDestination(url);

    let expandedLink: LinkExpanderDocument;

    try {
      expandedLink = await this.linkExpanderModel.create({
        userId,
        url,
        destinationUrl: expansion.destinationUrl,
        status: expansion.status,
        redirectCount: expansion.redirectCount,
        errorMessage: expansion.errorMessage,
      });
    } catch (error) {
      if (isDuplicateKeyError(error)) {
        throw new LinkExpanderAlreadyExistsException();
      }

      throw error;
    }

    if (expansion.status === LinkExpanderLookupStatus.FAILED) {
      throw new LinkExpansionFailedException(
        expansion.errorMessage ?? 'Unable to expand this link',
      );
    }

    return {
      message: 'Link expanded successfully',
      expandedLink: this.serializeExpandedLink(expandedLink),
    };
  }

  async getPaginatedData(
    user: JwtPayload,
    query: GetPaginatedExpandedLinksDto,
  ) {
    const userId = await this.getAuthenticatedUserId(user);
    const limit = query.limit ?? DEFAULT_LINK_EXPANDER_PAGE_LIMIT;
    const currentPage = query.page ?? 1;
    const cursorId = query.cursor
      ? toObjectId(query.cursor, 'Cursor id is invalid')
      : null;
    const skip = cursorId ? 0 : (currentPage - 1) * limit;
    const baseFilter = {
      userId,
      status: { $ne: LinkExpanderLookupStatus.DELETED },
    };

    const [expandedLinks, total] = await Promise.all([
      this.linkExpanderModel
        .find({
          ...baseFilter,
          ...(cursorId ? { _id: { $lt: cursorId } } : {}),
        })
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit + 1)
        .exec(),
      this.linkExpanderModel.countDocuments(baseFilter).exec(),
    ]);

    const hasMore = expandedLinks.length > limit;
    const items = (hasMore ? expandedLinks.slice(0, limit) : expandedLinks).map(
      (expandedLink) => this.serializeExpandedLink(expandedLink),
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

  async getAnalytics(user: JwtPayload) {
    const userId = await this.getAuthenticatedUserId(user);
    const [total, redirects, failed] = await Promise.all([
      this.linkExpanderModel
        .countDocuments({
          userId,
          status: { $ne: LinkExpanderLookupStatus.DELETED },
        })
        .exec(),
      this.linkExpanderModel
        .aggregate<{ totalRedirects: number }>([
          {
            $match: {
              userId,
              status: { $ne: LinkExpanderLookupStatus.DELETED },
            },
          },
          {
            $group: {
              _id: null,
              totalRedirects: { $sum: '$redirectCount' },
            },
          },
        ])
        .exec(),
      this.linkExpanderModel
        .countDocuments({
          userId,
          status: LinkExpanderLookupStatus.FAILED,
        })
        .exec(),
    ]);

    return {
      total,
      redirects: redirects[0]?.totalRedirects ?? 0,
      failed,
    };
  }

  async deleteExpandedLink(user: JwtPayload, expandedLinkId: string) {
    const userId = await this.getAuthenticatedUserId(user);
    const expandedLink = await this.getOwnedExpandedLink(
      userId,
      expandedLinkId,
    );

    expandedLink.status = LinkExpanderLookupStatus.DELETED;
    await expandedLink.save();

    return {
      message: 'Expanded link deleted successfully',
      deleted: true,
      expandedLink: this.serializeExpandedLink(expandedLink),
    };
  }

  private async resolveDestination(url: string): Promise<{
    destinationUrl: string;
    status: LinkExpanderLookupStatus;
    redirectCount: number;
    errorMessage: string | null;
  }> {
    try {
      const response = await this.followRedirects(url);

      return {
        destinationUrl: response.destinationUrl,
        status: response.ok
          ? LinkExpanderLookupStatus.SUCCESS
          : LinkExpanderLookupStatus.FAILED,
        redirectCount: response.redirectCount,
        errorMessage: response.ok
          ? null
          : `Destination responded with HTTP ${response.status}`,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      return {
        destinationUrl: url,
        status: LinkExpanderLookupStatus.FAILED,
        redirectCount: 0,
        errorMessage:
          error instanceof Error ? error.message : 'Unable to expand this link',
      };
    }
  }

  private async followRedirects(url: string): Promise<{
    destinationUrl: string;
    redirectCount: number;
    ok: boolean;
    status: number;
  }> {
    let currentUrl = url;

    for (
      let redirectCount = 0;
      redirectCount <= LINK_EXPANDER_MAX_REDIRECTS;
      redirectCount += 1
    ) {
      await this.assertPublicDestination(currentUrl);

      const response = await this.fetchWithoutRedirect(currentUrl, 'HEAD');
      const fallbackResponse =
        response.status === 405
          ? await this.fetchWithoutRedirect(currentUrl, 'GET')
          : response;

      if (!this.isRedirectStatus(fallbackResponse.status)) {
        return {
          destinationUrl: currentUrl,
          redirectCount,
          ok: fallbackResponse.ok,
          status: fallbackResponse.status,
        };
      }

      const location = fallbackResponse.headers.get('location');

      if (!location) {
        return {
          destinationUrl: currentUrl,
          redirectCount,
          ok: false,
          status: fallbackResponse.status,
        };
      }

      currentUrl = new URL(location, currentUrl).toString();
    }

    return {
      destinationUrl: currentUrl,
      redirectCount: LINK_EXPANDER_MAX_REDIRECTS,
      ok: false,
      status: 508,
    };
  }

  private async fetchWithoutRedirect(url: string, method: 'GET' | 'HEAD') {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      LINK_EXPANDER_TIMEOUT_MS,
    );

    try {
      return await fetch(url, {
        method,
        redirect: 'manual',
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  private isRedirectStatus(status: number) {
    return [301, 302, 303, 307, 308].includes(status);
  }

  private async assertPublicDestination(url: string) {
    const parsedUrl = new URL(url);
    const host = parsedUrl.hostname.toLowerCase();

    if (this.isBlockedHost(host)) {
      throw new BadRequestException({
        message: 'URL must point to a public internet host',
        error: 'Bad Request',
      });
    }

    if (isIP(host)) {
      return;
    }

    try {
      const addresses = await lookup(host, { all: true });

      if (addresses.some((address) => this.isBlockedHost(address.address))) {
        throw new BadRequestException({
          message: 'URL must point to a public internet host',
          error: 'Bad Request',
        });
      }
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
    }
  }

  private isBlockedHost(host: string) {
    if (
      host === 'localhost' ||
      host.endsWith('.localhost') ||
      host === '0.0.0.0' ||
      host === '::' ||
      host === '::1'
    ) {
      return true;
    }

    const ipVersion = isIP(host);

    if (ipVersion === 4) {
      const parts = host.split('.').map((part) => Number(part));
      const [first, second] = parts;

      return (
        first === 10 ||
        first === 127 ||
        (first === 169 && second === 254) ||
        (first === 172 && second >= 16 && second <= 31) ||
        (first === 192 && second === 168)
      );
    }

    if (ipVersion === 6) {
      return (
        host.startsWith('fc') ||
        host.startsWith('fd') ||
        host.startsWith('fe80:') ||
        host === '::ffff:127.0.0.1'
      );
    }

    return false;
  }

  private serializeExpandedLink(
    expandedLink: LinkExpanderDocument,
  ): SerializedExpandedLink {
    return {
      id: String(expandedLink._id),
      url: expandedLink.url,
      destinationUrl: expandedLink.destinationUrl,
      status: expandedLink.status,
      redirectCount: expandedLink.redirectCount,
      errorMessage: expandedLink.errorMessage ?? null,
      createdAt: expandedLink.createdAt ?? null,
      updatedAt: expandedLink.updatedAt ?? null,
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

  private async getOwnedExpandedLink(
    userId: Types.ObjectId,
    expandedLinkId: string,
  ): Promise<LinkExpanderDocument> {
    const urlId = toObjectId(expandedLinkId, 'Expanded link id is invalid');
    const expandedLink = await this.linkExpanderModel.findById(urlId).exec();

    if (
      !expandedLink ||
      expandedLink.status === LinkExpanderLookupStatus.DELETED
    ) {
      throw new LinkExpanderNotFoundException();
    }

    if (String(expandedLink.userId) !== String(userId)) {
      throw new LinkExpanderAccessDeniedException();
    }

    return expandedLink;
  }
}

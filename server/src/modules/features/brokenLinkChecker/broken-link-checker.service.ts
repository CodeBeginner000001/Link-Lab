import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { lookup } from 'dns/promises';
import { isIP } from 'net';
import { Model, Types } from 'mongoose';
import { AccessTokenExpired } from 'src/exceptions/auth.exception';
import {
  BrokenLinkCheckAccessDeniedException,
  BrokenLinkCheckNotFoundException,
} from 'src/exceptions/broken-link-checker.exception';
import { JwtPayload } from 'src/interfaces/auth.interface';
import {
  BrokenLinkChecker,
  BrokenLinkCheckerDocument,
  BrokenLinkCheckStatus,
  BrokenLinkSafetyStatus,
} from 'src/models/broken-link-checker.schema';
import { User, UserDocument } from 'src/models/user.schema';
import { normalizeHttpUrl, toObjectId } from '../utils/common.utils';
import {
  BROKEN_LINK_CHECKER_MAX_REDIRECTS,
  BROKEN_LINK_CHECKER_TIMEOUT_MS,
  DEFAULT_BROKEN_LINK_CHECKER_PAGE_LIMIT,
} from './broken-link-checker.constants';
import {
  CheckBrokenLinkDto,
  GetPaginatedBrokenLinkChecksDto,
} from './dto/broken-link-checker.dto';

type SerializedBrokenLinkCheck = {
  id: string;
  url: string;
  finalUrl: string;
  statusCode: number | null;
  status: BrokenLinkCheckStatus;
  isBroken: boolean;
  isUnsafe: boolean;
  safetyStatus: BrokenLinkSafetyStatus;
  safetyProvider: string | null;
  threatTypes: string[];
  contentType: string | null;
  contentLength: number | null;
  contentDisposition: string | null;
  errorMessage: string | null;
  redirectCount: number;
  createdAt: Date | null;
  updatedAt: Date | null;
};

type SafeBrowsingMatch = {
  threatType?: string;
  threat?: {
    url?: string;
  };
};

type SafeBrowsingResponse = {
  matches?: SafeBrowsingMatch[];
};

type LinkProbeResponse = {
  status: number;
  ok: boolean;
  location: string | null;
  contentType: string | null;
  contentLength: number | null;
  contentDisposition: string | null;
};

@Injectable()
export class BrokenLinkCheckerService {
  constructor(
    @InjectModel(BrokenLinkChecker.name)
    private readonly brokenLinkCheckerModel: Model<BrokenLinkCheckerDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly configService: ConfigService,
  ) {}

  async checkLink(user: JwtPayload, dto: CheckBrokenLinkDto) {
    const userId = await this.getAuthenticatedUserId(user);
    const url = normalizeHttpUrl({
      value: dto.url,
      fieldName: 'URL',
    });
    const result = await this.resolveLinkHealth(url);
    const reputation = await this.inspectThreats([url, result.finalUrl]);
    const localThreatTypes = this.getLocalThreatTypes(result);
    const threatTypes = [
      ...new Set([...reputation.threatTypes, ...localThreatTypes]),
    ];
    const isUnsafe = reputation.isUnsafe || localThreatTypes.length > 0;
    const safetyStatus = isUnsafe
      ? BrokenLinkSafetyStatus.UNSAFE
      : reputation.status;
    const linkCheck = await this.brokenLinkCheckerModel.create({
      userId,
      url,
      finalUrl: result.finalUrl,
      statusCode: result.statusCode,
      status: result.isBroken
        ? BrokenLinkCheckStatus.BROKEN
        : BrokenLinkCheckStatus.WORKING,
      isBroken: result.isBroken,
      isUnsafe,
      safetyStatus,
      safetyProvider: this.mergeSafetyProviders(
        reputation.provider,
        localThreatTypes.length > 0 ? 'linklab-static-download-policy' : null,
      ),
      threatTypes,
      contentType: result.contentType,
      contentLength: result.contentLength,
      contentDisposition: result.contentDisposition,
      errorMessage: result.errorMessage,
      redirectCount: result.redirectCount,
    });

    return {
      message: isUnsafe
        ? 'Link check completed. This link is flagged as unsafe.'
        : result.isBroken
          ? 'Link check completed. This link appears broken.'
          : 'Link check completed. This link is working.',
      linkCheck: this.serializeLinkCheck(linkCheck),
    };
  }

  async getPaginatedData(
    user: JwtPayload,
    query: GetPaginatedBrokenLinkChecksDto,
  ) {
    const userId = await this.getAuthenticatedUserId(user);
    const limit = query.limit ?? DEFAULT_BROKEN_LINK_CHECKER_PAGE_LIMIT;
    const currentPage = query.page ?? 1;
    const cursorId = query.cursor
      ? toObjectId(query.cursor, 'Cursor id is invalid')
      : null;
    const skip = cursorId ? 0 : (currentPage - 1) * limit;
    const baseFilter = {
      userId,
      status: { $ne: BrokenLinkCheckStatus.DELETED },
    };

    const [linkChecks, total] = await Promise.all([
      this.brokenLinkCheckerModel
        .find({
          ...baseFilter,
          ...(cursorId ? { _id: { $lt: cursorId } } : {}),
        })
        .sort({ _id: -1 })
        .skip(skip)
        .limit(limit + 1)
        .exec(),
      this.brokenLinkCheckerModel.countDocuments(baseFilter).exec(),
    ]);

    const hasMore = linkChecks.length > limit;
    const items = (hasMore ? linkChecks.slice(0, limit) : linkChecks).map(
      (linkCheck) => this.serializeLinkCheck(linkCheck),
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
    const [checked, broken, unsafe] = await Promise.all([
      this.brokenLinkCheckerModel
        .countDocuments({
          userId,
          status: { $ne: BrokenLinkCheckStatus.DELETED },
        })
        .exec(),
      this.brokenLinkCheckerModel
        .countDocuments({
          userId,
          status: BrokenLinkCheckStatus.BROKEN,
        })
        .exec(),
      this.brokenLinkCheckerModel
        .countDocuments({
          userId,
          isUnsafe: true,
          status: { $ne: BrokenLinkCheckStatus.DELETED },
        })
        .exec(),
    ]);

    return {
      checked,
      working: checked - broken,
      broken,
      unsafe,
    };
  }

  async deleteLinkCheck(user: JwtPayload, linkCheckId: string) {
    const userId = await this.getAuthenticatedUserId(user);
    const linkCheck = await this.getOwnedLinkCheck(userId, linkCheckId);

    linkCheck.status = BrokenLinkCheckStatus.DELETED;
    await linkCheck.save();

    return {
      message: 'Link check deleted successfully',
      deleted: true,
      linkCheck: this.serializeLinkCheck(linkCheck),
    };
  }

  private async resolveLinkHealth(url: string): Promise<{
    finalUrl: string;
    statusCode: number | null;
    isBroken: boolean;
    errorMessage: string | null;
    redirectCount: number;
    contentType: string | null;
    contentLength: number | null;
    contentDisposition: string | null;
  }> {
    try {
      const response = await this.followRedirects(url);
      const isBroken = !response.ok;

      return {
        finalUrl: response.finalUrl,
        statusCode: response.status,
        isBroken,
        errorMessage: isBroken
          ? `Destination responded with HTTP ${response.status}`
          : null,
        redirectCount: response.redirectCount,
        contentType: response.contentType,
        contentLength: response.contentLength,
        contentDisposition: response.contentDisposition,
      };
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }

      return {
        finalUrl: url,
        statusCode: null,
        isBroken: true,
        errorMessage:
          error instanceof Error ? error.message : 'Unable to check this link',
        redirectCount: 0,
        contentType: null,
        contentLength: null,
        contentDisposition: null,
      };
    }
  }

  private async followRedirects(url: string): Promise<{
    finalUrl: string;
    redirectCount: number;
    ok: boolean;
    status: number;
    contentType: string | null;
    contentLength: number | null;
    contentDisposition: string | null;
  }> {
    let currentUrl = url;

    for (
      let redirectCount = 0;
      redirectCount <= BROKEN_LINK_CHECKER_MAX_REDIRECTS;
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
          finalUrl: currentUrl,
          redirectCount,
          ok: fallbackResponse.ok,
          status: fallbackResponse.status,
          contentType: fallbackResponse.contentType,
          contentLength: fallbackResponse.contentLength,
          contentDisposition: fallbackResponse.contentDisposition,
        };
      }

      const location = fallbackResponse.location;

      if (!location) {
        return {
          finalUrl: currentUrl,
          redirectCount,
          ok: false,
          status: fallbackResponse.status,
          contentType: fallbackResponse.contentType,
          contentLength: fallbackResponse.contentLength,
          contentDisposition: fallbackResponse.contentDisposition,
        };
      }

      currentUrl = new URL(location, currentUrl).toString();
    }

    return {
      finalUrl: currentUrl,
      redirectCount: BROKEN_LINK_CHECKER_MAX_REDIRECTS,
      ok: false,
      status: 508,
      contentType: null,
      contentLength: null,
      contentDisposition: null,
    };
  }

  private async fetchWithoutRedirect(
    url: string,
    method: 'GET' | 'HEAD',
  ): Promise<LinkProbeResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(
      () => controller.abort(),
      BROKEN_LINK_CHECKER_TIMEOUT_MS,
    );

    try {
      const headers = new Headers();

      if (method === 'GET') {
        headers.set('range', 'bytes=0-0');
      }

      const response = await fetch(url, {
        method,
        headers,
        redirect: 'manual',
        signal: controller.signal,
      });
      const contentLengthHeader = response.headers.get('content-length');
      const contentLength = contentLengthHeader
        ? Number(contentLengthHeader)
        : null;

      await response.body?.cancel();

      return {
        status: response.status,
        ok: response.ok,
        location: response.headers.get('location'),
        contentType: response.headers.get('content-type'),
        contentLength:
          contentLength !== null && Number.isFinite(contentLength)
            ? contentLength
            : null,
        contentDisposition: response.headers.get('content-disposition'),
      };
    } finally {
      clearTimeout(timeout);
    }
  }

  private isRedirectStatus(status: number) {
    return [301, 302, 303, 307, 308].includes(status);
  }

  private getLocalThreatTypes(result: {
    finalUrl: string;
    contentType: string | null;
    contentDisposition: string | null;
  }) {
    const threatTypes = new Set<string>();
    const contentType = result.contentType?.toLowerCase() ?? '';
    const contentDisposition = result.contentDisposition?.toLowerCase() ?? '';
    const pathname = new URL(result.finalUrl).pathname.toLowerCase();
    const riskyContentTypes = [
      'application/octet-stream',
      'application/x-msdownload',
      'application/vnd.microsoft.portable-executable',
      'application/x-msdos-program',
      'application/x-executable',
      'application/x-dosexec',
      'application/java-archive',
      'application/x-sh',
      'application/x-bat',
      'application/x-msi',
      'application/vnd.android.package-archive',
      'application/x-apple-diskimage',
      'application/zip',
      'application/x-7z-compressed',
      'application/vnd.rar',
      'application/x-rar-compressed',
    ];
    const riskyExtensions = [
      '.apk',
      '.app',
      '.bat',
      '.cmd',
      '.com',
      '.dmg',
      '.exe',
      '.iso',
      '.jar',
      '.js',
      '.msi',
      '.pkg',
      '.ps1',
      '.rar',
      '.scr',
      '.sh',
      '.vbs',
      '.wsf',
      '.zip',
      '.7z',
    ];

    if (contentDisposition.includes('attachment')) {
      threatTypes.add('downloadable_content');
    }

    if (riskyContentTypes.some((type) => contentType.includes(type))) {
      threatTypes.add('risky_content_type');
    }

    if (riskyExtensions.some((extension) => pathname.endsWith(extension))) {
      threatTypes.add('risky_file_extension');
    }

    return [...threatTypes];
  }

  private mergeSafetyProviders(...providers: Array<string | null>) {
    const mergedProviders = [...new Set(providers.filter(Boolean))];

    return mergedProviders.length > 0 ? mergedProviders.join(',') : null;
  }

  private async inspectThreats(urls: string[]): Promise<{
    isUnsafe: boolean;
    status: BrokenLinkSafetyStatus;
    provider: string | null;
    threatTypes: string[];
  }> {
    const apiKey = this.configService.get<string>(
      'GOOGLE_SAFE_BROWSING_API_KEY',
    );

    if (!apiKey) {
      return {
        isUnsafe: false,
        status: BrokenLinkSafetyStatus.UNCHECKED,
        provider: null,
        threatTypes: [],
      };
    }

    try {
      const threatEntries = [...new Set(urls)].map((url) => ({ url }));
      const response = await fetch(
        `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client: {
              clientId: 'linklab',
              clientVersion: '1.0.0',
            },
            threatInfo: {
              threatTypes: [
                'MALWARE',
                'SOCIAL_ENGINEERING',
                'UNWANTED_SOFTWARE',
                'POTENTIALLY_HARMFUL_APPLICATION',
              ],
              platformTypes: ['ANY_PLATFORM'],
              threatEntryTypes: ['URL'],
              threatEntries,
            },
          }),
        },
      );

      if (!response.ok) {
        return {
          isUnsafe: false,
          status: BrokenLinkSafetyStatus.UNCHECKED,
          provider: 'google-safe-browsing',
          threatTypes: [],
        };
      }

      const result = (await response.json()) as SafeBrowsingResponse;
      const threatTypes = [
        ...new Set(
          (result.matches ?? [])
            .map((match) => match.threatType)
            .filter((threatType): threatType is string => Boolean(threatType)),
        ),
      ];

      return {
        isUnsafe: threatTypes.length > 0,
        status:
          threatTypes.length > 0
            ? BrokenLinkSafetyStatus.UNSAFE
            : BrokenLinkSafetyStatus.NO_KNOWN_THREAT,
        provider: 'google-safe-browsing',
        threatTypes,
      };
    } catch {
      return {
        isUnsafe: false,
        status: BrokenLinkSafetyStatus.UNCHECKED,
        provider: 'google-safe-browsing',
        threatTypes: [],
      };
    }
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

  private serializeLinkCheck(
    linkCheck: BrokenLinkCheckerDocument,
  ): SerializedBrokenLinkCheck {
    return {
      id: String(linkCheck._id),
      url: linkCheck.url,
      finalUrl: linkCheck.finalUrl,
      statusCode: linkCheck.statusCode ?? null,
      status: linkCheck.status,
      isBroken: linkCheck.isBroken,
      isUnsafe: linkCheck.isUnsafe,
      safetyStatus: linkCheck.safetyStatus,
      safetyProvider: linkCheck.safetyProvider ?? null,
      threatTypes: linkCheck.threatTypes ?? [],
      contentType: linkCheck.contentType ?? null,
      contentLength: linkCheck.contentLength ?? null,
      contentDisposition: linkCheck.contentDisposition ?? null,
      errorMessage: linkCheck.errorMessage ?? null,
      redirectCount: linkCheck.redirectCount,
      createdAt: linkCheck.createdAt ?? null,
      updatedAt: linkCheck.updatedAt ?? null,
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

  private async getOwnedLinkCheck(
    userId: Types.ObjectId,
    linkCheckId: string,
  ): Promise<BrokenLinkCheckerDocument> {
    const id = toObjectId(linkCheckId, 'Link check id is invalid');
    const linkCheck = await this.brokenLinkCheckerModel.findById(id).exec();

    if (!linkCheck || linkCheck.status === BrokenLinkCheckStatus.DELETED) {
      throw new BrokenLinkCheckNotFoundException();
    }

    if (String(linkCheck.userId) !== String(userId)) {
      throw new BrokenLinkCheckAccessDeniedException();
    }

    return linkCheck;
  }
}

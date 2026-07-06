import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AccessTokenExpired } from 'src/exceptions/auth.exception';
import { JwtPayload } from 'src/interfaces/auth.interface';
import { Barcode, BarcodeDocument } from 'src/models/barcode.schema';
import {
  BrokenLinkCheckStatus,
  BrokenLinkChecker,
  BrokenLinkCheckerDocument,
} from 'src/models/broken-link-checker.schema';
import {
  BulkBarcode,
  BulkBarcodeDocument,
  BulkBarcodeStatus,
} from 'src/models/bulk-barcode.schema';
import {
  LinkExpander,
  LinkExpanderDocument,
  LinkExpanderLookupStatus,
} from 'src/models/link-expander.schema';
import {
  OneTimeLink,
  OneTimeLinkDocument,
  OneTimeLinkStatus,
} from 'src/models/one-time-link.schema';
import {
  ShortUrl,
  ShortUrlDocument,
  ShortUrlStatus,
} from 'src/models/short-url.schema';
import { User, UserDocument } from 'src/models/user.schema';
import { BarcodeStatus } from '../features/barcodeGenerator/barcode-generator.constants';
import { toObjectId } from '../features/utils/common.utils';

type FeatureSummary = {
  key: string;
  label: string;
  href: string;
  count: number;
  metricLabel: string;
  secondaryValue?: number;
  secondaryLabel?: string;
};

type RecentActivity = {
  id: string;
  feature: string;
  label: string;
  description: string;
  href: string;
  createdAt: Date | null;
};

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(ShortUrl.name)
    private readonly shortUrlModel: Model<ShortUrlDocument>,
    @InjectModel(OneTimeLink.name)
    private readonly oneTimeLinkModel: Model<OneTimeLinkDocument>,
    @InjectModel(Barcode.name)
    private readonly barcodeModel: Model<BarcodeDocument>,
    @InjectModel(BulkBarcode.name)
    private readonly bulkBarcodeModel: Model<BulkBarcodeDocument>,
    @InjectModel(LinkExpander.name)
    private readonly linkExpanderModel: Model<LinkExpanderDocument>,
    @InjectModel(BrokenLinkChecker.name)
    private readonly brokenLinkCheckerModel: Model<BrokenLinkCheckerDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async getSummary(user: JwtPayload) {
    const userId = await this.getAuthenticatedUserId(user);

    const [
      shortUrlCount,
      shortUrlClicks,
      oneTimeLinkCount,
      usedOneTimeLinkCount,
      barcodeCount,
      barcodeDownloads,
      bulkBarcodeCount,
      bulkBarcodeGenerated,
      linkExpanderCount,
      linkExpanderRedirects,
      brokenLinkCount,
      unsafeBrokenLinkCount,
      recentShortUrl,
      recentOneTimeLink,
      recentBarcode,
      recentBulkBarcode,
      recentLinkExpander,
      recentBrokenLink,
    ] = await Promise.all([
      this.shortUrlModel.countDocuments({
        userId,
        status: ShortUrlStatus.ACTIVE,
      }),
      this.sumNumber(this.shortUrlModel, { userId }, 'clicksPersisted'),
      this.oneTimeLinkModel.countDocuments({
        userId,
        status: OneTimeLinkStatus.ACTIVE,
      }),
      this.oneTimeLinkModel.countDocuments({
        userId,
        status: OneTimeLinkStatus.USED,
      }),
      this.barcodeModel.countDocuments({
        userId,
        status: BarcodeStatus.ACTIVE,
      }),
      this.sumNumber(this.barcodeModel, { userId }, 'totalDownloads'),
      this.bulkBarcodeModel.countDocuments({
        userId,
        status: BulkBarcodeStatus.COMPLETED,
      }),
      this.sumNumber(this.bulkBarcodeModel, { userId }, 'generatedCount'),
      this.linkExpanderModel.countDocuments({
        userId,
        status: { $ne: LinkExpanderLookupStatus.DELETED },
      }),
      this.sumNumber(this.linkExpanderModel, { userId }, 'redirectCount'),
      this.brokenLinkCheckerModel.countDocuments({
        userId,
        status: { $ne: BrokenLinkCheckStatus.DELETED },
      }),
      this.brokenLinkCheckerModel.countDocuments({
        userId,
        isUnsafe: true,
        status: { $ne: BrokenLinkCheckStatus.DELETED },
      }),
      this.findRecent(this.shortUrlModel, {
        userId,
        status: ShortUrlStatus.ACTIVE,
      }),
      this.findRecent(this.oneTimeLinkModel, {
        userId,
        status: { $ne: OneTimeLinkStatus.DELETED },
      }),
      this.findRecent(this.barcodeModel, {
        userId,
        status: BarcodeStatus.ACTIVE,
      }),
      this.findRecent(this.bulkBarcodeModel, {
        userId,
        status: BulkBarcodeStatus.COMPLETED,
      }),
      this.findRecent(this.linkExpanderModel, {
        userId,
        status: { $ne: LinkExpanderLookupStatus.DELETED },
      }),
      this.findRecent(this.brokenLinkCheckerModel, {
        userId,
        status: { $ne: BrokenLinkCheckStatus.DELETED },
      }),
    ]);

    const tools: FeatureSummary[] = [
      {
        key: 'url-shortener',
        label: 'URL Shortener',
        href: '/dashboard/url-shortener',
        count: shortUrlCount,
        metricLabel: 'active links',
        secondaryValue: shortUrlClicks,
        secondaryLabel: 'recorded clicks',
      },
      {
        key: 'one-time-link',
        label: 'One-Time Links',
        href: '/dashboard/onetime-link',
        count: oneTimeLinkCount,
        metricLabel: 'active links',
        secondaryValue: usedOneTimeLinkCount,
        secondaryLabel: 'used links',
      },
      {
        key: 'barcode-generator',
        label: 'Barcode Generator',
        href: '/dashboard/barcode-generator',
        count: barcodeCount,
        metricLabel: 'active barcodes',
        secondaryValue: barcodeDownloads,
        secondaryLabel: 'downloads',
      },
      {
        key: 'bulk-barcode-generator',
        label: 'Bulk Barcode Generator',
        href: '/dashboard/bulk-barcode-generator',
        count: bulkBarcodeCount,
        metricLabel: 'completed batches',
        secondaryValue: bulkBarcodeGenerated,
        secondaryLabel: 'barcodes generated',
      },
      {
        key: 'link-expander',
        label: 'Link Expander',
        href: '/dashboard/link-expander',
        count: linkExpanderCount,
        metricLabel: 'lookups',
        secondaryValue: linkExpanderRedirects,
        secondaryLabel: 'redirects traced',
      },
      {
        key: 'broken-link-checker',
        label: 'Broken Link Checker',
        href: '/dashboard/broken-link-checker',
        count: brokenLinkCount,
        metricLabel: 'checks',
        secondaryValue: unsafeBrokenLinkCount,
        secondaryLabel: 'unsafe results',
      },
    ];

    const totalItems = tools.reduce((sum, tool) => sum + tool.count, 0);
    const totalActivity = tools.reduce(
      (sum, tool) => sum + (tool.secondaryValue ?? 0),
      0,
    );
    const activeTools = tools.filter((tool) => tool.count > 0).length;
    const recentActivity = [
      this.serializeShortUrlActivity(recentShortUrl),
      this.serializeOneTimeLinkActivity(recentOneTimeLink),
      this.serializeBarcodeActivity(recentBarcode),
      this.serializeBulkBarcodeActivity(recentBulkBarcode),
      this.serializeLinkExpanderActivity(recentLinkExpander),
      this.serializeBrokenLinkActivity(recentBrokenLink),
    ]
      .filter((activity): activity is RecentActivity => Boolean(activity))
      .sort(
        (first, second) =>
          new Date(second.createdAt ?? 0).getTime() -
          new Date(first.createdAt ?? 0).getTime(),
      )
      .slice(0, 6);

    return {
      stats: {
        totalItems,
        totalActivity,
        activeTools,
        availableTools: tools.length,
      },
      tools,
      recentActivity,
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

  private async sumNumber<T>(
    model: Model<T>,
    match: Record<string, unknown>,
    field: string,
  ) {
    const [result] = await model
      .aggregate<{
        total: number;
      }>([
        { $match: match },
        { $group: { _id: null, total: { $sum: `$${field}` } } },
      ])
      .exec();

    return result?.total ?? 0;
  }

  private async findRecent<T>(
    model: Model<T>,
    filter: Record<string, unknown>,
  ) {
    return model.findOne(filter).sort({ createdAt: -1 }).exec();
  }

  private serializeShortUrlActivity(
    item: ShortUrlDocument | null,
  ): RecentActivity | null {
    if (!item) return null;

    return {
      id: String(item._id),
      feature: 'URL Shortener',
      label: item.alias,
      description: item.longUrl,
      href: '/dashboard/url-shortener',
      createdAt: item.createdAt ?? null,
    };
  }

  private serializeOneTimeLinkActivity(
    item: OneTimeLinkDocument | null,
  ): RecentActivity | null {
    if (!item) return null;

    return {
      id: String(item._id),
      feature: 'One-Time Links',
      label: item.alias,
      description: item.originalUrl,
      href: '/dashboard/onetime-link',
      createdAt: item.createdAt ?? null,
    };
  }

  private serializeBarcodeActivity(
    item: BarcodeDocument | null,
  ): RecentActivity | null {
    if (!item) return null;

    return {
      id: String(item._id),
      feature: 'Barcode Generator',
      label: item.format,
      description: item.content,
      href: '/dashboard/barcode-generator',
      createdAt: item.createdAt ?? null,
    };
  }

  private serializeBulkBarcodeActivity(
    item: BulkBarcodeDocument | null,
  ): RecentActivity | null {
    if (!item) return null;

    return {
      id: String(item._id),
      feature: 'Bulk Barcode Generator',
      label: item.fileName,
      description: `${item.generatedCount} generated, ${item.failedCount} failed`,
      href: '/dashboard/bulk-barcode-generator',
      createdAt: item.createdAt ?? null,
    };
  }

  private serializeLinkExpanderActivity(
    item: LinkExpanderDocument | null,
  ): RecentActivity | null {
    if (!item) return null;

    return {
      id: String(item._id),
      feature: 'Link Expander',
      label: item.status,
      description: item.destinationUrl || item.url,
      href: '/dashboard/link-expander',
      createdAt: item.createdAt ?? null,
    };
  }

  private serializeBrokenLinkActivity(
    item: BrokenLinkCheckerDocument | null,
  ): RecentActivity | null {
    if (!item) return null;

    return {
      id: String(item._id),
      feature: 'Broken Link Checker',
      label: item.status,
      description: item.finalUrl || item.url,
      href: '/dashboard/broken-link-checker',
      createdAt: item.createdAt ?? null,
    };
  }
}

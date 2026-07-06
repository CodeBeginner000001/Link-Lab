import { BarcodeActivityDateInvalidException } from 'src/exceptions/barcode.exception';

export type ActivityPeriod = 'week' | 'month' | 'year';

export type ActivityRange = {
  start: Date;
  end: Date;
  previousStart: Date;
  previousEnd: Date;
  labels: string[];
  mongoDateFormat: string;
};

export function getActivityRange(
  period: ActivityPeriod,
  value: string,
): ActivityRange {
  if (period === 'week') {
    return getWeekRange(value);
  }

  if (period === 'month') {
    return getMonthRange(value);
  }

  if (period === 'year') {
    return getYearRange(value);
  }

  throw new BarcodeActivityDateInvalidException(period);
}

function getWeekRange(value: string): ActivityRange {
  const match = /^(\d{4})-W(\d{2})$/.exec(value);

  if (!match) {
    throw new BarcodeActivityDateInvalidException('week');
  }

  const year = Number(match[1]);
  const week = Number(match[2]);

  if (year < 1000 || year > 9999 || week < 1 || week > 53) {
    throw new BarcodeActivityDateInvalidException('week');
  }

  const januaryFourth = new Date(Date.UTC(year, 0, 4));
  const januaryFourthDay = januaryFourth.getUTCDay() || 7;
  const firstMonday = new Date(januaryFourth);
  firstMonday.setUTCDate(januaryFourth.getUTCDate() - januaryFourthDay + 1);

  const start = new Date(firstMonday);
  start.setUTCDate(firstMonday.getUTCDate() + (week - 1) * 7);
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 7);

  const weekThursday = new Date(start);
  weekThursday.setUTCDate(start.getUTCDate() + 3);

  if (weekThursday.getUTCFullYear() !== year) {
    throw new BarcodeActivityDateInvalidException('week');
  }

  return {
    start,
    end,
    previousStart: new Date(start.getTime() - 7 * 86400000),
    previousEnd: new Date(start),
    labels: getDailyLabels(start, 7),
    mongoDateFormat: '%Y-%m-%d',
  };
}

function getMonthRange(value: string): ActivityRange {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(value);

  if (!match) {
    throw new BarcodeActivityDateInvalidException('month');
  }

  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;

  if (year < 1000 || year > 9999) {
    throw new BarcodeActivityDateInvalidException('month');
  }

  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1));
  const days = Math.round(
    (end.getTime() - start.getTime()) / (24 * 60 * 60 * 1000),
  );

  return {
    start,
    end,
    previousStart: new Date(Date.UTC(year, monthIndex - 1, 1)),
    previousEnd: new Date(start),
    labels: getDailyLabels(start, days),
    mongoDateFormat: '%Y-%m-%d',
  };
}

function getYearRange(value: string): ActivityRange {
  if (!/^\d{4}$/.test(value)) {
    throw new BarcodeActivityDateInvalidException('year');
  }

  const year = Number(value);

  if (year < 1000 || year > 9999) {
    throw new BarcodeActivityDateInvalidException('year');
  }

  const start = new Date(Date.UTC(year, 0, 1));
  const end = new Date(Date.UTC(year + 1, 0, 1));

  return {
    start,
    end,
    previousStart: new Date(Date.UTC(year - 1, 0, 1)),
    previousEnd: new Date(start),
    labels: Array.from(
      { length: 12 },
      (_, index) => `${year}-${String(index + 1).padStart(2, '0')}`,
    ),
    mongoDateFormat: '%Y-%m',
  };
}

function getDailyLabels(start: Date, count: number): string[] {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    return date.toISOString().slice(0, 10);
  });
}

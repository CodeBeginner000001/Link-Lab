import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';

export class BarcodeNotFoundException extends NotFoundException {
  constructor() {
    super({
      message: 'Barcode not found',
      error: 'Not Found',
    });
  }
}

export class BarcodeAccessDeniedException extends ForbiddenException {
  constructor() {
    super({
      message: 'You do not have access to this barcode',
      error: 'Forbidden',
    });
  }
}

export class BarcodeContentInvalidException extends BadRequestException {
  constructor(message: string) {
    super({
      message,
      error: 'Bad Request',
    });
  }
}

export class BarcodeGenerationException extends BadRequestException {
  constructor(message = 'Unable to generate barcode from the provided values') {
    super({
      message,
      error: 'Bad Request',
    });
  }
}

export class BarcodeDuplicateRequestException extends ConflictException {
  constructor() {
    super({
      message: 'An identical barcode has already been created',
      error: 'Conflict',
    });
  }
}

export class BarcodeActivityDateInvalidException extends BadRequestException {
  constructor(period: string) {
    super({
      message: `Date is invalid for the selected ${period} period`,
      error: 'Bad Request',
    });
  }
}

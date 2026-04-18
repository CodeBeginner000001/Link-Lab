import {
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';

export class InvalidQrCodeContentException extends BadRequestException {
  constructor(message: string) {
    super({
      message,
      error: 'Bad Request',
    });
  }
}

export class QrCodePublicIdGenerationFailedException extends InternalServerErrorException {
  constructor() {
    super({
      message: 'Could not generate a unique QR code public id',
      error: 'Internal Server Error',
    });
  }
}

export class QrCodeNotFoundException extends NotFoundException {
  constructor() {
    super({
      message: 'QR code not found',
      error: 'Not Found',
    });
  }
}

export class QrCodeExportUnavailableException extends BadRequestException {
  constructor(message = 'QR code export is unavailable') {
    super({
      message,
      error: 'Bad Request',
    });
  }
}

export class QrCodeAccessDeniedException extends ForbiddenException {
  constructor() {
    super({
      message: 'You do not have access to this QR code',
      error: 'Forbidden',
    });
  }
}

export class QrCodeDuplicateRequestException extends BadRequestException {
  constructor() {
    super({
      message: 'Same request body already exists for this QR code',
      error: 'Bad Request',
    });
  }
}

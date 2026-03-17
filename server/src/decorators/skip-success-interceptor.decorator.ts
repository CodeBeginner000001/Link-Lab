import { SetMetadata } from '@nestjs/common';

export const SKIP_RESPONSE_INTERCEPTOR_KEY = 'skipResponseInterceptor';
export const SkipResponseInterceptor = () =>
  SetMetadata(SKIP_RESPONSE_INTERCEPTOR_KEY, true);

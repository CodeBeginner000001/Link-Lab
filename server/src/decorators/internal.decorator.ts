import { SetMetadata } from '@nestjs/common';

export const INTERNAL_API_KEY = 'internal_api';
export const Internal = () => SetMetadata(INTERNAL_API_KEY, true);

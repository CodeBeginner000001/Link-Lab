import {
  BadRequestException,
  Controller,
  Get,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AvatarService } from './avatar.service';

@Controller('v1/avatar')
export class AvatarController {
  constructor(private readonly avatarService: AvatarService) {}
  @Get()
  getAvatar(@Query('name') name: string, @Res() res: Response) {
    if (!name || !name.trim()) {
      throw new BadRequestException('name is required');
    }
    const svg = this.avatarService.generateAvatar(name);

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=86400');
    return res.send(svg);
  }
}

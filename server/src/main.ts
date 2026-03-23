import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import * as os from 'os';
import { AppModule } from './app.module';
import { AppLogger } from './common/app.logger';

function getLocalIp(): string {
  const networkInterface = os.networkInterfaces();
  for (const name of Object.keys(networkInterface)) {
    const netList = networkInterface[name];
    if (!netList) continue;
    for (const net of netList) {
      const isIPv4 = net.family === 'IPv4';
      if (isIPv4 && !net.internal) {
        return net.address;
      }
    }
  }
  return 'Not found';
}

function printStartupBanner(logger: AppLogger, values: Record<string, string>) {
  const lines = Object.entries(values).map(
    ([key, value]) => `${key}: ${value}`,
  );
  const contentWidth = Math.max(...lines.map((line) => line.length), 30);
  const horizontal = '-'.repeat(contentWidth + 2);
  logger.log(`┌${horizontal}┐`, 'Bootstrap');
  logger.log(`│ ${' '.repeat(contentWidth)} │`, 'Bootstrap');

  for (const line of lines) {
    logger.log(`│ ${line.padEnd(contentWidth, ' ')} │`, 'Bootstrap');
  }

  logger.log(`│ ${' '.repeat(contentWidth)} │`, 'Bootstrap');
  logger.log(`└${horizontal}┘`, 'Bootstrap');
}
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  const logger = app.get(AppLogger);
  app.useLogger(logger);
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      stopAtFirstError: false,
      exceptionFactory: (errors) => {
        const messages = errors.flatMap((error) =>
          error.constraints ? Object.values(error.constraints) : [],
        );

        throw new BadRequestException({
          message: messages.length ? messages : ['Validation failed'],
          error: 'Validation Error',
        });
      },
    }),
  );

  const host = process.env.HOST || '0.0.0.0';
  const port = Number(process.env.PORT || 3000);
  await app.listen(port, host);
  const localIp = getLocalIp();
  printStartupBanner(logger, {
    '🚀 LinkLab Server': 'Running',
    '🌐 Localhost': `http://localhost:${port}`,
    '🖥️  Loopback': `http://127.0.0.1:${port}`,
    '📡 Network':
      localIp !== 'Not found' ? `http://${localIp}:${port}` : 'Not found',
    '🕒 ENV': process.env.NODE_ENV || 'development',
    '📦 PORT': String(port),
  });
}
bootstrap();

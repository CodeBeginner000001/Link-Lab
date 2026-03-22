import { Injectable, OnApplicationShutdown } from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection, ConnectionStates } from 'mongoose';
import { AppLogger } from '../app.logger';

@Injectable()
export class MongoService implements OnApplicationShutdown {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly logger: AppLogger,
  ) {}

  isConnected(): boolean {
    return this.connection.readyState === ConnectionStates.connected;
  }

  getConnection(): Connection {
    return this.connection;
  }

  async onApplicationShutdown(): Promise<void> {
    if (this.connection.readyState !== ConnectionStates.disconnected) {
      await this.connection.close();
      this.logger.log('🔌 [Mongo] Connection closed', 'MongoService');
    }
  }
}

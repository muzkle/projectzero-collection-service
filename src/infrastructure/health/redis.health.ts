import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import Redis from 'ioredis';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(private config: ConfigService) {
    super();
  }

  async pingCheck(key: string): Promise<HealthIndicatorResult> {
    const redisUrl = this.config.get<string>('REDIS_URL');
    if (!redisUrl) {
      return this.getStatus(key, false, { message: 'REDIS_URL not configured' });
    }

    const redis = new Redis(redisUrl, { maxRetriesPerRequest: 1, connectTimeout: 3000 });
    try {
      const pong = await redis.ping();
      return this.getStatus(key, pong === 'PONG');
    } catch (error) {
      return this.getStatus(key, false, {
        message: error instanceof Error ? error.message : 'Redis unavailable',
      });
    } finally {
      redis.disconnect();
    }
  }
}

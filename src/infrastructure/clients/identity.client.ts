import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface IdentityUserDto {
  id: string;
  displayName: string;
  avatarUrl?: string;
}

@Injectable()
export class IdentityClient {
  private client: AxiosInstance;

  constructor(private config: ConfigService) {
    this.client = axios.create({
      baseURL: this.config.get('IDENTITY_SERVICE_URL'),
      timeout: 10000,
    });
  }

  async getUser(userId: string): Promise<IdentityUserDto | null> {
    try {
      const { data } = await this.client.get<{ data: IdentityUserDto }>(
        `/v1/internal/users/${userId}`,
        {
          headers: { 'x-internal-service-key': this.config.get('INTERNAL_SERVICE_KEY') },
        },
      );
      return data.data;
    } catch {
      return { id: userId, displayName: 'Collector' };
    }
  }
}

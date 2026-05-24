import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface StickerSupplyDto {
  supplyTotal?: number;
  supplyMinted: number;
}

@Injectable()
export class CatalogClient {
  private client: AxiosInstance;

  constructor(private config: ConfigService) {
    this.client = axios.create({
      baseURL: this.config.get('CATALOG_SERVICE_URL'),
      timeout: 15000,
    });
  }

  private headers() {
    return { 'x-internal-service-key': this.config.get('INTERNAL_SERVICE_KEY') };
  }

  async getSupply(stickerId: string): Promise<StickerSupplyDto> {
    const { data } = await this.client.get<{ data: StickerSupplyDto }>(
      `/v1/internal/stickers/${stickerId}/supply`,
      { headers: this.headers() },
    );
    return data.data;
  }

  async incrementSupply(stickerId: string): Promise<StickerSupplyDto> {
    const { data } = await this.client.patch<{ data: StickerSupplyDto }>(
      `/v1/internal/stickers/${stickerId}/supply/increment`,
      {},
      { headers: this.headers() },
    );
    return data.data;
  }
}

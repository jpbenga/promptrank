import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { ConfigureShopifyRequest, ShopifyConnection, ShopifySyncResponse } from '@promptrank/shared-types';
import type { Product, ShopifyConnection as PrismaShopifyConnection } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';
import { MockShopifyClient } from './mock-shopify.client';
import { normalizeShopifyProduct } from './shopify-normalizer';

type ProjectWithCurrency = { id: string; currency: string };

@Injectable()
export class ShopifyService {
  constructor(private readonly prisma: PrismaService, private readonly mockClient: MockShopifyClient) {}

  private validateDomain(shopDomain?: string) {
    const normalized = (shopDomain || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!/^[a-z0-9][a-z0-9-]*\.myshopify\.com$/.test(normalized)) {
      throw new BadRequestException({ code: 'SHOPIFY_INVALID_DOMAIN', message: 'Invalid Shopify domain' });
    }
    return normalized;
  }

  private async getProject(projectId: string): Promise<ProjectWithCurrency> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId }, select: { id: true, currency: true } });
    if (!project) throw new NotFoundException({ code: 'PROJECT_NOT_FOUND', message: 'Project not found' });
    return project;
  }

  private assertRealEnabled() {
    if (process.env.SHOPIFY_REAL_SYNC_ENABLED !== 'true') {
      throw new BadRequestException({ code: 'SHOPIFY_REAL_SYNC_DISABLED', message: 'Real Shopify sync disabled' });
    }
  }

  private toConnectionDto(connection: PrismaShopifyConnection): ShopifyConnection {
    return {
      id: connection.id,
      projectId: connection.projectId,
      shopDomain: connection.shopDomain,
      accessTokenMasked: connection.accessTokenMasked,
      mode: connection.mode as ShopifyConnection['mode'],
      status: connection.status as ShopifyConnection['status'],
      lastSyncAt: connection.lastSyncAt ? connection.lastSyncAt.toISOString() : null,
      lastError: connection.lastError,
      createdAt: connection.createdAt.toISOString(),
      updatedAt: connection.updatedAt.toISOString(),
    };
  }

  private disconnectedDto(projectId: string): ShopifyConnection {
    const now = new Date().toISOString();
    return { id: '', projectId, shopDomain: '', accessTokenMasked: null, mode: 'mock', status: 'disconnected', lastSyncAt: null, lastError: null, createdAt: now, updatedAt: now };
  }

  async configure(projectId: string, body: ConfigureShopifyRequest) {
    await this.getProject(projectId);
    const mode = body.mode || 'mock';
    if (!['mock', 'real'].includes(mode)) throw new BadRequestException({ code: 'SHOPIFY_REAL_SYNC_DISABLED', message: 'Unsupported Shopify mode' });
    if (mode === 'real') this.assertRealEnabled();
    const shopDomain = this.validateDomain(body.shopDomain);
    const connection = await this.prisma.shopifyConnection.upsert({
      where: { projectId },
      create: { projectId, shopDomain, mode, status: 'connected', accessTokenMasked: null, lastError: null },
      update: { shopDomain, mode, status: 'connected', accessTokenMasked: null, lastError: null },
    });
    return { connection: this.toConnectionDto(connection) };
  }

  async status(projectId: string) {
    await this.getProject(projectId);
    const connection = await this.prisma.shopifyConnection.findUnique({ where: { projectId } });
    return { connection: connection ? this.toConnectionDto(connection) : this.disconnectedDto(projectId) };
  }

  private async ensureConnection(projectId: string) {
    const existing = await this.prisma.shopifyConnection.findUnique({ where: { projectId } });
    if (existing) return existing;
    return this.prisma.shopifyConnection.create({
      data: { projectId, shopDomain: 'demo.myshopify.com', mode: process.env.SHOPIFY_SYNC_MODE || 'mock', status: 'connected' },
    });
  }

  private async upsertProduct(projectId: string, data: any) {
    const existing = await this.prisma.product.findFirst({
      where: { projectId, OR: [{ source: 'shopify', externalId: data.externalId }, ...(data.sku ? [{ sku: data.sku }] : [])] },
    });
    if (existing) {
      const updated = await this.prisma.product.update({ where: { id: existing.id }, data: { ...data, projectId } });
      return { product: updated, created: false };
    }
    const created = await this.prisma.product.create({ data: { ...data, projectId } });
    return { product: created, created: true };
  }

  async sync(projectId: string): Promise<ShopifySyncResponse> {
    const project = await this.getProject(projectId);
    let connection = await this.ensureConnection(projectId);
    if (connection.mode === 'real') this.assertRealEnabled();
    if (connection.mode !== 'mock') throw new BadRequestException({ code: 'SHOPIFY_CONNECTION_NOT_FOUND', message: 'Shopify connection not available' });

    try {
      const shopifyProducts = await this.mockClient.listProducts(connection.shopDomain);
      let importedCount = 0;
      let updatedCount = 0;
      let skippedCount = 0;
      const products: Product[] = [];
      for (const item of shopifyProducts) {
        const normalized = normalizeShopifyProduct(item, connection.shopDomain, project.currency);
        if (!normalized.title) { skippedCount++; continue; }
        const result = await this.upsertProduct(projectId, normalized);
        if (result.created) importedCount++; else updatedCount++;
        products.push(result.product);
      }
      connection = await this.prisma.shopifyConnection.update({
        where: { projectId },
        data: { status: 'synced', lastSyncAt: new Date(), lastError: null },
      });
      return {
        connection: this.toConnectionDto(connection),
        importedCount,
        updatedCount,
        skippedCount,
        products: products.map(product => ({ ...product, createdAt: product.createdAt.toISOString(), updatedAt: product.updatedAt.toISOString() })) as any,
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      await this.prisma.shopifyConnection.update({ where: { projectId }, data: { status: 'sync_failed', lastError: 'SHOPIFY_SYNC_FAILED' } }).catch(() => undefined);
      throw new BadRequestException({ code: 'SHOPIFY_SYNC_FAILED', message: 'Shopify sync failed' });
    }
  }
}

import type { NormalizedProduct } from '@promptrank/shared-types';
import type { ShopifyProduct } from './shopify-client.types';

function stripHtml(value?: string) {
  return (value || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function parseTags(tags: string | string[]) {
  if (Array.isArray(tags)) return tags.map(tag => tag.trim()).filter(Boolean);
  return tags.split(',').map(tag => tag.trim()).filter(Boolean);
}

function parsePrice(value?: string) {
  const price = Number((value || '').replace(',', '.'));
  return Number.isFinite(price) ? price : undefined;
}

export function normalizeShopifyProduct(product: ShopifyProduct, shopDomain: string, currency = 'EUR'): Omit<NormalizedProduct, 'id'> {
  const variant = product.variants[0];
  const inventoryQuantity = variant?.inventory_quantity ?? 0;
  return {
    source: 'shopify',
    externalId: product.id,
    sku: variant?.sku,
    title: product.title,
    description: stripHtml(product.body_html),
    brand: product.vendor,
    vendor: product.vendor,
    productType: product.product_type,
    category: product.product_type,
    price: parsePrice(variant?.price),
    currency,
    availability: inventoryQuantity > 0 ? 'in_stock' : 'out_of_stock',
    stockQuantity: inventoryQuantity,
    url: `https://${shopDomain}/products/${product.handle}`,
    imageUrls: product.images.map(image => image.src),
    tags: parseTags(product.tags),
    gtin: variant?.barcode || undefined,
    rawSource: product,
    attributes: {
      shopifyVendor: product.vendor,
      shopifyProductType: product.product_type,
      shopifyStatus: product.status,
      shopifyVariantId: variant?.id || '',
    },
  };
}

import { Injectable } from '@nestjs/common';
import type { ShopifyClient, ShopifyProduct } from './shopify-client.types';

@Injectable()
export class MockShopifyClient implements ShopifyClient {
  async listProducts(_shopDomain: string): Promise<ShopifyProduct[]> {
    return [
      {
        id: 'gid://shopify/Product/1001',
        title: 'Gourde inox isotherme 750ml',
        vendor: 'HydroPeak',
        product_type: 'Hydration',
        handle: 'gourde-inox-isotherme-750ml',
        body_html: '<p>Gourde inox double paroi pour randonnée, bureau et sport.</p>',
        variants: [{ id: 'v1001', price: '29.90', sku: 'HP-BTL-750', barcode: '3760000000011', inventory_quantity: 42 }],
        images: [{ id: 'i1001', src: 'https://cdn.shopify.mock/products/gourde-inox.jpg' }],
        tags: 'gourde, inox, randonnée, sport',
        status: 'active',
      },
      {
        id: 'gid://shopify/Product/1002',
        title: 'Sac randonnée compact 25L',
        vendor: 'TrailNest',
        product_type: 'Backpacks',
        handle: 'sac-randonnee-compact-25l',
        body_html: '<p>Sac léger avec poches latérales et housse pluie intégrée.</p>',
        variants: [{ id: 'v1002', price: '64.50', sku: 'TN-BAG-25', barcode: '3760000000028', inventory_quantity: 18 }],
        images: [{ id: 'i1002', src: 'https://cdn.shopify.mock/products/sac-randonnee.jpg' }],
        tags: ['sac', 'randonnée', 'outdoor'],
        status: 'active',
      },
      {
        id: 'gid://shopify/Product/1003',
        title: 'Lampe frontale rechargeable 450 lm',
        vendor: 'Lumora',
        product_type: 'Lighting',
        handle: 'lampe-frontale-rechargeable-450lm',
        body_html: '<p>Lampe frontale USB-C avec faisceau réglable et mode rouge.</p>',
        variants: [{ id: 'v1003', price: '39.00', sku: 'LM-HEAD-450', barcode: '3760000000035', inventory_quantity: 0 }],
        images: [{ id: 'i1003', src: 'https://cdn.shopify.mock/products/lampe-frontale.jpg' }],
        tags: 'lampe, trail, camping',
        status: 'active',
      },
      {
        id: 'gid://shopify/Product/1004',
        title: 'Tapis yoga antidérapant 6mm',
        vendor: 'ZenMat',
        product_type: 'Yoga',
        handle: 'tapis-yoga-antiderapant-6mm',
        body_html: '<p>Tapis confortable en TPE avec surface stable pour yoga et pilates.</p>',
        variants: [{ id: 'v1004', price: '34.90', sku: 'ZM-YOGA-6', barcode: '3760000000042', inventory_quantity: 27 }],
        images: [{ id: 'i1004', src: 'https://cdn.shopify.mock/products/tapis-yoga.jpg' }],
        tags: ['yoga', 'fitness', 'tpe'],
        status: 'active',
      },
      {
        id: 'gid://shopify/Product/1005',
        title: 'Montre sport GPS endurance',
        vendor: 'PulseWay',
        product_type: 'Wearables',
        handle: 'montre-sport-gps-endurance',
        body_html: '<p>Montre sport avec GPS, suivi cardio et autonomie longue durée.</p>',
        variants: [{ id: 'v1005', price: '149.00', sku: 'PW-GPS-END', barcode: '3760000000059', inventory_quantity: 12 }],
        images: [{ id: 'i1005', src: 'https://cdn.shopify.mock/products/montre-sport.jpg' }],
        tags: 'montre, gps, running, sport',
        status: 'active',
      },
    ];
  }
}

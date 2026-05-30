export type ShopifyVariant = {
  id: string;
  price: string;
  sku: string;
  barcode?: string | null;
  inventory_quantity: number;
};

export type ShopifyImage = {
  id: string;
  src: string;
};

export type ShopifyProduct = {
  id: string;
  title: string;
  vendor: string;
  product_type: string;
  handle: string;
  body_html?: string;
  variants: ShopifyVariant[];
  images: ShopifyImage[];
  tags: string | string[];
  status: string;
};

export type ShopifyClient = {
  listProducts(shopDomain: string): Promise<ShopifyProduct[]>;
};

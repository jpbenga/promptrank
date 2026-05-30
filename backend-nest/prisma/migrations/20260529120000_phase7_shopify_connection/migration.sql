CREATE TABLE "ShopifyConnection" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "shopDomain" TEXT NOT NULL,
    "accessTokenMasked" TEXT,
    "mode" TEXT NOT NULL DEFAULT 'mock',
    "status" TEXT NOT NULL DEFAULT 'connected',
    "lastSyncAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShopifyConnection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ShopifyConnection_projectId_key" ON "ShopifyConnection"("projectId");
CREATE INDEX "ShopifyConnection_projectId_status_idx" ON "ShopifyConnection"("projectId", "status");
CREATE INDEX "ShopifyConnection_shopDomain_idx" ON "ShopifyConnection"("shopDomain");

ALTER TABLE "ShopifyConnection" ADD CONSTRAINT "ShopifyConnection_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

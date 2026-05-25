CREATE TABLE "ProductPrompt" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "text" TEXT NOT NULL,
  "language" TEXT NOT NULL,
  "country" TEXT NOT NULL,
  "intent" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'template',
  "status" TEXT NOT NULL DEFAULT 'proposed',
  "position" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ProductPrompt_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "ProductPrompt_projectId_productId_idx" ON "ProductPrompt"("projectId", "productId");
ALTER TABLE "ProductPrompt" ADD CONSTRAINT "ProductPrompt_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductPrompt" ADD CONSTRAINT "ProductPrompt_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

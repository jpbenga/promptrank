-- CreateTable
CREATE TABLE "PromptRun" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "productId" TEXT NOT NULL,
  "promptId" TEXT NOT NULL,
  "provider" TEXT NOT NULL DEFAULT 'mock',
  "model" TEXT NOT NULL DEFAULT 'mock-v1',
  "responseText" TEXT NOT NULL,
  "brandMentioned" BOOLEAN NOT NULL,
  "productMentioned" BOOLEAN NOT NULL,
  "competitorsMentioned" JSONB NOT NULL,
  "position" INTEGER,
  "sentiment" TEXT NOT NULL DEFAULT 'unknown',
  "status" TEXT NOT NULL DEFAULT 'completed',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PromptRun_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "PromptRun_projectId_promptId_idx" ON "PromptRun"("projectId", "promptId");
CREATE INDEX "PromptRun_projectId_productId_idx" ON "PromptRun"("projectId", "productId");
ALTER TABLE "PromptRun" ADD CONSTRAINT "PromptRun_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromptRun" ADD CONSTRAINT "PromptRun_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PromptRun" ADD CONSTRAINT "PromptRun_promptId_fkey" FOREIGN KEY ("promptId") REFERENCES "ProductPrompt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

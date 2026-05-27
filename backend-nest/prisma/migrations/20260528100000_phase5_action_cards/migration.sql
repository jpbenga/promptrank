-- CreateTable
CREATE TABLE "ActionCard" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "productId" TEXT,
  "scoreId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "priority" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'open',
  "impact" TEXT NOT NULL,
  "effort" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "recommendation" TEXT NOT NULL,
  "metadata" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ActionCard_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ActionCard_projectId_status_idx" ON "ActionCard"("projectId", "status");
CREATE INDEX "ActionCard_projectId_productId_idx" ON "ActionCard"("projectId", "productId");
CREATE INDEX "ActionCard_projectId_category_idx" ON "ActionCard"("projectId", "category");

ALTER TABLE "ActionCard" ADD CONSTRAINT "ActionCard_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActionCard" ADD CONSTRAINT "ActionCard_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ActionCard" ADD CONSTRAINT "ActionCard_scoreId_fkey" FOREIGN KEY ("scoreId") REFERENCES "VisibilityScore"("id") ON DELETE SET NULL ON UPDATE CASCADE;

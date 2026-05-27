-- CreateTable
CREATE TABLE "VisibilityScore" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "productId" TEXT,
  "scope" TEXT NOT NULL,
  "score" INTEGER NOT NULL,
  "analyzedPromptsCount" INTEGER NOT NULL,
  "brandMentionRate" DOUBLE PRECISION NOT NULL,
  "productMentionRate" DOUBLE PRECISION NOT NULL,
  "competitorMentionRate" DOUBLE PRECISION NOT NULL,
  "averagePosition" DOUBLE PRECISION,
  "dominantSentiment" TEXT NOT NULL,
  "topCompetitors" JSONB NOT NULL,
  "details" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "VisibilityScore_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VisibilityScore_projectId_scope_idx" ON "VisibilityScore"("projectId", "scope");
CREATE INDEX "VisibilityScore_projectId_productId_idx" ON "VisibilityScore"("projectId", "productId");

ALTER TABLE "VisibilityScore" ADD CONSTRAINT "VisibilityScore_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "VisibilityScore" ADD CONSTRAINT "VisibilityScore_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

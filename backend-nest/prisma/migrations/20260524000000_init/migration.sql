-- Initial prisma migration for PromptRank phase 1 CSV
CREATE TABLE IF NOT EXISTS "Project" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'csv',
  "primaryLanguage" TEXT NOT NULL,
  "targetCountry" TEXT NOT NULL,
  "currency" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP NOT NULL
);

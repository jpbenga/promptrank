const { execFileSync } = require('node:child_process');
const { existsSync, readFileSync } = require('node:fs');
const { resolve } = require('node:path');

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return;
  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || !trimmed.includes('=')) continue;
    const index = trimmed.indexOf('=');
    const key = trimmed.slice(0, index).trim();
    const value = trimmed.slice(index + 1).trim().replace(/^['"]|['"]$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

function run(command, args, options = {}) {
  execFileSync(command, args, { stdio: 'inherit', ...options });
}

loadEnvFile(resolve(process.cwd(), '.env'));
loadEnvFile(resolve(process.cwd(), '.env.example'));

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
if (!testDatabaseUrl) {
  throw new Error('TEST_DATABASE_URL is required to prepare the integration test database.');
}

if (!process.env.CI) {
  const postgresUser = process.env.POSTGRES_USER || 'promptrank';
  const postgresTestDb = process.env.POSTGRES_TEST_DB || 'promptrank_test';
  try {
    run('docker', ['compose', 'exec', '-T', 'postgres', 'createdb', '-U', postgresUser, postgresTestDb]);
  } catch {
    // The database may already exist. Prisma db push below is the authoritative schema step.
  }
}

run('pnpm', ['--filter', '@promptrank/api', 'exec', 'prisma', 'db', 'push', '--skip-generate'], {
  env: { ...process.env, DATABASE_URL: testDatabaseUrl },
});

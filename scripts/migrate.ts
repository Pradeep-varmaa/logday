import fs from 'fs';
import path from 'path';
import { neon } from '@neondatabase/serverless';

// Load .env.local or .env if process.env.DATABASE_URL is not set
function loadEnv() {
  const envFiles = ['.env.local', '.env'];
  for (const envFile of envFiles) {
    const envPath = path.resolve(process.cwd(), envFile);
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf8');
      for (const line of content.split('\n')) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) continue;
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx !== -1) {
          const key = trimmed.slice(0, eqIdx).trim();
          let val = trimmed.slice(eqIdx + 1).trim();
          if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
            val = val.slice(1, -1);
          }
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    }
  }
}

async function runMigration() {
  loadEnv();

  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error('❌ Error: DATABASE_URL is not defined in environment variables or .env.local');
    process.exit(1);
  }

  console.log('🚀 Connecting to Neon PostgreSQL...');
  const sql = neon(databaseUrl);

  const files = [
    '01_tables.sql',
    '02_procedures.sql',
    '03_seed.sql'
  ];

  for (const filename of files) {
    const filePath = path.resolve(process.cwd(), 'db', filename);
    if (!fs.existsSync(filePath)) {
      console.error(`❌ File not found: ${filePath}`);
      process.exit(1);
    }

    console.log(`\n⏳ Executing /db/${filename}...`);
    const sqlContent = fs.readFileSync(filePath, 'utf8');

    const startTime = Date.now();
    try {
      // Execute the entire SQL script
      await (sql as any)(sqlContent);
      const elapsed = Date.now() - startTime;
      console.log(`✅ Successfully applied /db/${filename} (${elapsed}ms)`);
    } catch (err: any) {
      console.error(`❌ Migration failed on ${filename}:`, err.message || err);
      process.exit(1);
    }
  }

  console.log('\n🎉 All DayLog migrations and seed scripts finished successfully!\n');
}

runMigration().catch((err) => {
  console.error('Fatal error during migration:', err);
  process.exit(1);
});

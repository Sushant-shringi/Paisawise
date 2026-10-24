import dotenv from 'dotenv';
dotenv.config();

import { initializeDatabase } from './db';
import { createApp } from './app';
import { initializeMailer } from './mailer';

const PORT = Number(process.env.PORT) || 4000;
const dbPath = process.env.DATABASE_PATH;

console.log('[PaisaWise Backend] Initializing database...');
const db = initializeDatabase(dbPath);
initializeMailer();
const app = createApp(db);

const server = app.listen(PORT, '127.0.0.1', () => {
  const engine = 'type' in db && db.type === 'postgres' ? 'Supabase PostgreSQL' : 'Local SQLite';
  console.log(`[PaisaWise Backend] Server active on http://127.0.0.1:${PORT} (${engine})`);
});

process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close(async () => {
    await db.close();
    process.exit(0);
  });
});

import dotenv from 'dotenv';
dotenv.config();

import { initializeDatabase } from './db';
import { createApp } from './app';
import { initializeMailer } from './mailer';

const PORT = Number(process.env.PORT) || 4000;
const dbPath = process.env.DATABASE_PATH;

console.log('Initializing PaisaWise SQLite Local Database...');
const db = initializeDatabase(dbPath);
initializeMailer();
const app = createApp(db);

const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`[PaisaWise Backend] Local API server active on http://127.0.0.1:${PORT}`);
});

process.on('SIGINT', () => {
  console.log('Shutting down server...');
  server.close(() => {
    db.close();
    process.exit(0);
  });
});

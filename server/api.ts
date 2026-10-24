import { createApp } from './app';
import { initializeDatabase } from './db';
import { initializeMailer } from './mailer';

const db = initializeDatabase();
initializeMailer();
const app = createApp(db);

export default app;

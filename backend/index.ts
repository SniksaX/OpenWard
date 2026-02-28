// index.ts
import app from './src/app';
import { initDb } from './src/db/database';
import { config } from './src/config/env';

initDb();

app.listen(config.port, () => {
    console.log(`[Server] OpenWard backend running on http://localhost:${config.port}`);
});
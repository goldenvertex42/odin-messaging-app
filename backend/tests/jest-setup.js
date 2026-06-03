import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('⚙️ Synchronously intercepting environment for Test worker thread...');

dotenv.config({ path: path.resolve(__dirname, '../../.env') }); 

if (!process.env.TEST_DATABASE_URL) {
  throw new Error('❌ Critical Setup Failure: TEST_DATABASE_URL is missing from your root .env file!');
}

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
process.env.JWT_SECRET = 'ULTRA_SECURE_DETERMINISTIC_TESTING_SECRET_KEY_MATRIX_999';

console.log('🟢 Redirected system runtime to TEST_DATABASE_URL and aligned JWT_SECRET.');


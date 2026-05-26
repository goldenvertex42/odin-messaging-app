import dotenv from 'dotenv';
import path from 'path';

export default async function () {
  console.log('⚙️ Intercepting environment for Test Suite isolation...');
  
  // Resolve back to the root .env workspace file
  dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

  // Guard check: ensures developers configured their local test database variable
  if (!process.env.TEST_DATABASE_URL) {
    throw new Error('❌ Critical Setup Failure: TEST_DATABASE_URL is missing from your root .env file!');
  }

  // Force the standard parameter to map directly to the isolated testing instance
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
  
  console.log('🟢 Redirected system runtime to TEST_DATABASE_URL successfully.');
}
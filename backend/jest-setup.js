import dotenv from 'dotenv';
import path from 'path';

export default async function () {
  console.log('⚙️  Loading global setup environment variables...');
  
  dotenv.config({ path: path.resolve(process.cwd(), '../.env') });
  
  process.env.DATABASE_URL = process.env.DATABASE_URL;
}
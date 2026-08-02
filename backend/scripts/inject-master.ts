import fs from 'fs';
import path from 'path';
import { masterEndpoints } from './master-endpoints';

const indexPath = path.join(__dirname, '../src/index.ts');
let content = fs.readFileSync(indexPath, 'utf-8');

if (!content.includes('MASTER ADMIN ROUTES')) {
  content = content.replace('const ownerMiddleware = async', masterEndpoints + '\nconst ownerMiddleware = async');
  fs.writeFileSync(indexPath, content);
  console.log('Master routes injected');
} else {
  console.log('Master routes already exist');
}

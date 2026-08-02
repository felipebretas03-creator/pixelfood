import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const directory = path.join(__dirname, 'src', 'app');

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

let changedCount = 0;

walk(directory, function(filePath) {
  if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
    let content = fs.readFileSync(filePath, 'utf-8');
    
    // Specifically target onClick={() => router.back()} in JSX/TSX
    // and replace it with onClick={() => router.push('/')}
    const newContent = content.replace(/onClick=\{\(\) => router\.back\(\)\}/g, "onClick={() => router.push('/')}");
    
    // Also replace standalone router.back() in handlers if requested, but user said "quando clicar na seta para voltar".
    // The ArrowLeft icon is inside a button with onClick={() => router.back()}
    
    if (newContent !== content) {
      fs.writeFileSync(filePath, newContent, 'utf-8');
      changedCount++;
      console.log(`Updated ${filePath}`);
    }
  }
});

console.log(`Total files updated: ${changedCount}`);

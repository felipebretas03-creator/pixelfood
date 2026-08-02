import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const directories = [
  path.join(__dirname, 'src', 'app'),
  path.join(__dirname, 'src', 'components'),
  path.join(__dirname, 'src', 'lib'),
  path.join(__dirname, 'src', 'store')
];

function walk(dir, callback) {
  if (!fs.existsSync(dir)) return;
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    isDirectory ? walk(dirPath, callback) : callback(path.join(dir, f));
  });
}

let changedCount = 0;

directories.forEach(directory => {
  walk(directory, function(filePath) {
    if (filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      let content = fs.readFileSync(filePath, 'utf-8');
      
      const newContent = content.replace(/http:\/\/localhost:4000/g, "http://127.0.0.1:4000");
      
      if (newContent !== content) {
        fs.writeFileSync(filePath, newContent, 'utf-8');
        changedCount++;
        console.log(`Updated ${filePath}`);
      }
    }
  });
});

console.log(`Total files updated: ${changedCount}`);

import fs from 'fs';
import path from 'path';

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(file));
    } else if (file.endsWith('.tsx')) {
      results.push(file);
    }
  });
  return results;
}

const files = walk('frontend/src/app/[slug]');

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  if (content.includes("router.push('/')") || content.includes("router.push('/pedidos") || content.includes("router.push('/carrinho")) {
    
    // Replace routers
    content = content.replace(/router\.push\('\/'\)/g, "router.push(`/${slug}`)");
    content = content.replace(/router\.push\('\/pedidos\/\$\{/g, "router.push(`/${slug}/pedidos/${");
    content = content.replace(/router\.push\('\/carrinho'\)/g, "router.push(`/${slug}/carrinho`)");
    
    // Check if slug is defined, if not, inject it
    if (!content.includes('const slug =')) {
      if (!content.includes('useParams')) {
        content = content.replace('import { usePathname }', 'import { usePathname, useParams }');
        if (!content.includes('useParams')) {
          content = content.replace('from "next/navigation";', 'from "next/navigation";\nimport { useParams } from "next/navigation";');
        }
      }
      content = content.replace(/(export default function [a-zA-Z0-9_]+\([^)]*\) \{)/, "$1\n  const params = useParams();\n  const slug = params?.slug as string;\n");
    }

    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
});

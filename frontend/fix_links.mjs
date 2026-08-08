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
  
  // se tiver Link href="/
  if (content.includes('<Link href="/') || content.includes('router.push("/')) {
    
    // Replace links
    content = content.replace(/<Link\s+href="\/([^"]*)"/g, "<Link href={`/${slug}/$1`}");
    content = content.replace(/router\.push\("\/([^"]*)"\)/g, "router.push(`/${slug}/$1`)");
    
    // Add import useParams if needed
    if (!content.includes('useParams')) {
      content = content.replace('import { usePathname }', 'import { usePathname, useParams }');
      if (!content.includes('useParams')) {
        content = content.replace('from "next/navigation";', 'from "next/navigation";\nimport { useParams } from "next/navigation";');
      }
      if (!content.includes('useParams')) {
         content = content.replace(/import Link from "next\/link";/, 'import Link from "next/link";\nimport { useParams } from "next/navigation";');
      }
    }

    // Insert const params = useParams(); const slug = params?.slug;
    // We look for 'export default function '
    content = content.replace(/(export default function [a-zA-Z0-9_]+\([^)]*\) \{)/, "$1\n  const params = useParams();\n  const slug = params?.slug as string;\n");
    
    fs.writeFileSync(file, content, 'utf8');
    console.log('Fixed', file);
  }
});

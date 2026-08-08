import fs from 'fs';

const files = [
  'frontend/src/app/[slug]/pedidos/[id]/page.tsx',
  'frontend/src/app/[slug]/pedidos/[id]/acompanhamento/page.tsx',
  'frontend/src/app/[slug]/restaurante/[id]/page.tsx'
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/const params = useParams\(\);/g, "const routerParams = useParams();");
  content = content.replace(/const slug = params\?\.slug as string;/g, "const slug = routerParams?.slug as string;");
  fs.writeFileSync(file, content, 'utf8');
});

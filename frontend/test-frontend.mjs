import fetch from 'node-fetch';

async function main() {
  const res = await fetch('http://localhost:3000/restaurante-teste');
  const text = await res.text();
  const match = text.match(/<style[^>]*>.*?--color-brand-500:([^;]+).*?<\/style>/s);
  if (match) {
    console.log("Injected color:", match[1].trim());
  } else {
    console.log("Style block not found or no match");
  }
}
main().catch(console.error);

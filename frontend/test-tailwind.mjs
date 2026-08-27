import fetch from 'node-fetch';

async function main() {
  const res = await fetch('http://localhost:3000/restaurante-teste');
  const text = await res.text();
  // Find the URL of the Next.js CSS bundle
  const cssMatch = text.match(/_next\/static\/css\/[^"]+\.css/);
  if (cssMatch) {
    console.log("CSS file:", cssMatch[0]);
    const cssRes = await fetch('http://localhost:3000/' + cssMatch[0]);
    const cssText = await cssRes.text();
    // Look for .text-brand-500 or .bg-brand-500 in the CSS
    const classMatch = cssText.match(/\.text-brand-500\{[^}]+\}/);
    if (classMatch) {
      console.log("Found class:", classMatch[0]);
    } else {
      console.log("Class .text-brand-500 not found in CSS");
    }
  } else {
    console.log("No CSS bundle found");
  }
}
main().catch(console.error);

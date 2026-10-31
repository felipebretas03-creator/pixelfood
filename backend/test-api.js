fetch('http://localhost:4000/api/products', { headers: { 'x-tenant-id': 'bf78d199-1745-442e-8ecc-aa57d832d340' } })
  .then(res => res.json())
  .then(data => console.dir(data, { depth: null }));

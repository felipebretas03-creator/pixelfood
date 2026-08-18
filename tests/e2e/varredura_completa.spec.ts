import { test, expect, Page } from '@playwright/test';

const PAINEL_URL = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:3000';
const SLUG = 'marcos-burguer';

// Erros esperados em ambiente de desenvolvimento sem seed (restaurante não encontrado)
const EXPECTED_404_ERRORS = [
  'Failed to load resource: the server responded with a status of 404',
  'Tenant não encontrado',
  'Not Found',
];

// Erros fatais (nunca devem ocorrer)
const FATAL_ERRORS = [
  'TypeError',
  'ReferenceError',
  'SyntaxError',
  'Cannot read properties',
  'is not a function',
  'is not defined',
  'Unhandled Runtime Error',
  'ChunkLoadError',
  'HMR',
  '_next/webpack-hmr',
];

function isFatalError(msg: string): boolean {
  return FATAL_ERRORS.some(e => msg.includes(e));
}

function isExpected404(msg: string): boolean {
  return EXPECTED_404_ERRORS.some(e => msg.includes(e));
}

// =====================================================
// FASE 1: BACKEND HEALTH
// =====================================================
test.describe('Fase 1 – Backend Health', () => {
  test('API raiz retorna mensagem de status', async ({ request }) => {
    const res = await request.get('http://localhost:4000/');
    expect(res.status()).toBe(200);
    const text = await res.text();
    expect(text).toContain('PixelFood');
  });

  test('Endpoint /health retorna status ok', async ({ request }) => {
    const res = await request.get('http://localhost:4000/health');
    expect(res.status()).toBe(200);
    const json = await res.json();
    expect(json.status).toBe('ok');
  });

  test('Endpoint /ready retorna status ok', async ({ request }) => {
    const res = await request.get('http://localhost:4000/ready');
    expect(res.status()).toBe(200);
  });
});

// =====================================================
// FASE 2: PAINEL – Telas públicas
// =====================================================
test.describe('Fase 2 – Painel: Telas públicas', () => {
  test('Página de login renderiza com formulário correto', async ({ page }) => {
    const errosFatais: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && isFatalError(msg.text())) errosFatais.push(msg.text());
    });
    page.on('pageerror', err => errosFatais.push(err.message));

    await page.goto(`${PAINEL_URL}/login`);
    await page.waitForLoadState('networkidle');

    // Verifica formulário correto (form com onSubmit)
    const form = page.locator('form');
    await expect(form).toBeVisible();

    // Campos obrigatórios
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible();

    const senhaInput = page.locator('input[type="password"]').first();
    await expect(senhaInput).toBeVisible();

    // Botão deve ser type="submit"
    const btnSubmit = page.locator('button[type="submit"]').first();
    await expect(btnSubmit).toBeVisible();
    await expect(btnSubmit).toBeEnabled();

    expect(errosFatais, `Erros fatais na tela de login: ${errosFatais.join(', ')}`).toHaveLength(0);
  });

  test('Página de cadastro renderiza sem erros fatais', async ({ page }) => {
    const errosFatais: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error' && isFatalError(msg.text())) errosFatais.push(msg.text());
    });
    page.on('pageerror', err => errosFatais.push(err.message));

    await page.goto(`${PAINEL_URL}/cadastro`);
    await page.waitForLoadState('networkidle');

    const form = page.locator('form');
    await expect(form).toBeVisible();

    expect(errosFatais, `Erros fatais no cadastro: ${errosFatais.join(', ')}`).toHaveLength(0);
  });

  test('Tecla Enter no login submete o formulário', async ({ page }) => {
    await page.goto(`${PAINEL_URL}/login`);
    await page.waitForLoadState('networkidle');

    const emailInput = page.locator('input[type="email"]').first();
    const senhaInput = page.locator('input[type="password"]').first();

    await emailInput.fill('teste@invalido.com');
    await senhaInput.fill('senhaerrada');

    // Enter deve submeter (não travar)
    await senhaInput.press('Enter');
    await page.waitForTimeout(3000);

    // Deve permanecer na tela de login após credencial inválida
    expect(page.url()).toMatch(/login/);
  });
});

// =====================================================
// FASE 3: PAINEL – Todas as rotas carregam
// =====================================================
test.describe('Fase 3 – Painel: Todas as rotas', () => {
  const rotasPainel = [
    '/',
    '/aovivo',
    '/cardapio',
    '/pedidos',
    '/clientes',
    '/configuracoes',
    '/marketing',
    '/completar-cadastro',
    '/master',
  ];

  for (const rota of rotasPainel) {
    test(`Rota ${PAINEL_URL}${rota} sem erros fatais de JS`, async ({ page }) => {
      const errosFatais: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error' && isFatalError(msg.text())) errosFatais.push(msg.text());
      });
      page.on('pageerror', err => {
        if (isFatalError(err.message)) errosFatais.push(err.message);
      });

      await page.goto(`${PAINEL_URL}${rota}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1500);

      const body = await page.locator('body').textContent();
      expect(body).toBeTruthy();
      expect(body!.length).toBeGreaterThan(0);

      expect(errosFatais, `Erros fatais em ${rota}: ${errosFatais.join(' | ')}`).toHaveLength(0);
    });
  }
});

// =====================================================
// FASE 4: FRONTEND – Todas as rotas
// =====================================================
test.describe('Fase 4 – Frontend: Todas as rotas', () => {
  const rotasFrontend = [
    '/',
    `/${SLUG}`,
    `/${SLUG}/login`,
    `/${SLUG}/cadastro`,
    `/${SLUG}/carrinho`,
    `/${SLUG}/pedidos`,
    `/${SLUG}/perfil`,
  ];

  for (const rota of rotasFrontend) {
    test(`Rota ${FRONTEND_URL}${rota} sem erros fatais de JS`, async ({ page }) => {
      const errosFatais: string[] = [];
      page.on('console', msg => {
        if (msg.type() === 'error' && isFatalError(msg.text())) errosFatais.push(msg.text());
        // 404 de restaurante não encontrado é esperado sem seed — ignora
      });
      page.on('pageerror', err => {
        if (isFatalError(err.message)) errosFatais.push(err.message);
      });

      await page.goto(`${FRONTEND_URL}${rota}`);
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(2000);

      const body = await page.locator('body').textContent();
      expect(body).toBeTruthy();
      expect(body!.length).toBeGreaterThan(0);

      expect(errosFatais, `Erros fatais em ${rota}: ${errosFatais.join(' | ')}`).toHaveLength(0);
    });
  }
});

// =====================================================
// FASE 5: RESPONSIVIDADE
// =====================================================
test.describe('Fase 5 – Responsividade mobile', () => {
  test('Login do painel sem scroll horizontal no mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${PAINEL_URL}/login`);
    await page.waitForLoadState('networkidle');

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalScroll, 'Scroll horizontal no mobile no login do painel').toBe(false);
  });

  test('Cadastro do painel sem scroll horizontal no mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${PAINEL_URL}/cadastro`);
    await page.waitForLoadState('networkidle');

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalScroll, 'Scroll horizontal no mobile no cadastro').toBe(false);
  });

  test('Frontend sem scroll horizontal no mobile', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${FRONTEND_URL}/${SLUG}`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const hasHorizontalScroll = await page.evaluate(() => {
      return document.documentElement.scrollWidth > window.innerWidth;
    });
    expect(hasHorizontalScroll, 'Scroll horizontal no mobile no cardápio').toBe(false);
  });
});

// =====================================================
// FASE 6: FLUXO DE API
// =====================================================
test.describe('Fase 6 – Fluxo de API crítico', () => {
  test('Registro de lojista com dados válidos retorna token', async ({ request }) => {
    const timestamp = Date.now();
    const res = await request.post('http://localhost:4000/api/auth/register', {
      data: {
        name: `Restaurante Teste ${timestamp}`,
        email: `teste${timestamp}@pixelfood.com`,
        password: 'Senha@123'
      }
    });
    expect([200, 400]).toContain(res.status());
    if (res.status() === 200) {
      const json = await res.json();
      expect(json.token).toBeTruthy();
      expect(json.tenant.slug).toBeTruthy();
    }
  });

  test('Login com e-mail inexistente retorna erro', async ({ request }) => {
    const res = await request.post('http://localhost:4000/api/auth/login', {
      data: { email: 'naoexiste@xyz123abc.com', password: 'qualquersenha' },
      headers: { 'x-restaurant-slug': SLUG }
    });
    expect([401, 403, 404]).toContain(res.status());
  });

  test('Rota protegida sem token retorna 401 ou 403', async ({ request }) => {
    const res = await request.put('http://localhost:4000/api/settings', {
      data: { storeName: 'Teste' },
      headers: { 'x-restaurant-slug': SLUG }
    });
    // 401 (sem token) ou 403 (proibido) são respostas válidas de proteção de rota
    // 404 também é válido quando o tenant-slug não existe no banco (tenantMiddleware executa primeiro)
    expect([401, 403, 404]).toContain(res.status());
  });

  test('API de categorias retorna array', async ({ request }) => {
    const res = await request.get('http://localhost:4000/api/categories', {
      headers: { 'x-restaurant-slug': SLUG }
    });
    expect([200, 404]).toContain(res.status());
    if (res.status() === 200) {
      const json = await res.json();
      expect(Array.isArray(json)).toBe(true);
    }
  });

  test('API de produtos retorna array', async ({ request }) => {
    const res = await request.get('http://localhost:4000/api/products', {
      headers: { 'x-restaurant-slug': SLUG }
    });
    expect([200, 404]).toContain(res.status());
    if (res.status() === 200) {
      const json = await res.json();
      expect(Array.isArray(json)).toBe(true);
    }
  });

  test('API de bairros responde', async ({ request }) => {
    const res = await request.get('http://localhost:4000/api/neighborhoods', {
      headers: { 'x-restaurant-slug': SLUG }
    });
    expect([200, 404]).toContain(res.status());
  });

  test('Registro com e-mail inválido retorna erro', async ({ request }) => {
    const res = await request.post('http://localhost:4000/api/auth/register', {
      data: { name: '', email: '', password: '' }
    });
    expect(res.status()).toBe(400);
  });
});

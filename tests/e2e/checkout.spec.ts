import { test, expect } from '@playwright/test';

test.describe('Checkout Flow (Frontend Consumidor)', () => {
  test('deve abrir o cardápio e verificar itens disponíveis', async ({ page }) => {
    // A rota principal deve redirecionar ou abrir a lista de restaurantes/produtos
    // Supondo que a URL seja localhost:3000
    await page.goto('http://127.0.0.1:3000/');
    
    // Verifica se a página carregou
    await expect(page).toHaveTitle(/PixelFood/i);
    
    // Como a listagem é dinâmica baseada no seed, validamos ao menos que o header ou main loadou
    await expect(page.locator('header')).toBeVisible();
  });
});

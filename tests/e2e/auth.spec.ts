import { test, expect } from '@playwright/test';

test.describe('Lojista Auth Flow', () => {
  test('deve renderizar a tela de login', async ({ page }) => {
    await page.goto('http://127.0.0.1:3001/login');
    
    // Verifica se os elementos chave estão na página
    await expect(page.getByRole('heading', { name: /entrar/i })).toBeVisible();
    await expect(page.getByPlaceholder(/seu@email/i)).toBeVisible();
    await expect(page.getByPlaceholder(/senha/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /entrar/i })).toBeVisible();
  });

  test('deve validar credenciais incorretas', async ({ page }) => {
    await page.goto('http://127.0.0.1:3001/login');
    
    await page.getByPlaceholder(/seu@email/i).fill('teste@inexistente.com');
    await page.getByPlaceholder(/senha/i).fill('senha123');
    await page.getByRole('button', { name: /entrar/i }).click();

    // Espera a mensagem de erro (ajuste conforme a implementação do toast/mensagem)
    // Se o backend retorna 401, o frontend pode exibir 'Credenciais inválidas'
    await expect(page.getByText(/Credenciais inválidas|erro|inválido/i)).toBeVisible();
  });
});

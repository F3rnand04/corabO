import { test, expect } from '@playwright/test';

test.describe('Flujo de Autenticación', () => {
  test('El flujo de login de invitado funciona correctamente', async ({ page }) => {
    // 1. Navegar a la página de login
    await page.goto('/login');

    // 2. Esperar a que el botón de invitado esté visible y hacer clic
    const guestButton = page.getByRole('button', { name: 'Ingresar como Invitado' });
    await expect(guestButton).toBeVisible({ timeout: 15000 });
    await guestButton.click();

    // 3. Esperar la redirección a la página principal
    // La página principal debe tener el header con el input de búsqueda
    const searchInput = page.getByPlaceholder('Buscar por servicio, producto...');
    await expect(searchInput).toBeVisible({ timeout: 20000 });

    // 4. Verificar que la URL es la correcta (estamos en la página principal)
    await expect(page).toHaveURL('/');
  });
});

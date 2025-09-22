
import { test, expect } from '@playwright/test';

test('El flujo de login de invitado funciona correctamente', async ({ page }) => {
  // 1. Abrir la aplicación (Playwright usará el baseURL de la configuración)
  await page.goto('/');

  // 2. Verificar que estamos en la página de login, esperando que el botón sea visible.
  // Aumentamos el timeout por si la carga inicial es lenta.
  await expect(page.getByRole('button', { name: 'Ingresar como Invitado' })).toBeVisible({ timeout: 15000 });

  // 3. Hacer clic en el botón de invitado
  await page.getByRole('button', { name: 'Ingresar como Invitado' }).click();

  // 4. Verificar que se redirige al feed y que el header de búsqueda es visible.
  // Esperamos por un elemento distintivo del feed.
  await expect(page.getByPlaceholder('Buscar por servicio, producto...')).toBeVisible({ timeout: 15000 });
});

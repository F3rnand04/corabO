import { test, expect } from '@playwright/test';

test.describe('Página de Perfil del Proveedor', () => {
  // Asumimos que existe un proveedor con este ID para las pruebas
  const providerId = 'S2eR2V1iXzY3wA4b5C6d';

  test.beforeEach(async ({ page }) => {
    // 1. Iniciar sesión como invitado
    await page.goto('/');
    await page.getByRole('button', { name: 'Ingresar como Invitado' }).click();
    await expect(page.getByPlaceholder('Buscar por servicio, producto...')).toBeVisible({ timeout: 15000 });

    // 2. Navegar directamente al perfil del proveedor
    await page.goto(`/companies/${providerId}`);
  });

  test('El usuario puede ver el perfil y cambiar entre pestañas', async ({ page }) => {
    // 3. Verificar que el nombre del proveedor es visible
    // Esto confirma que la página cargó correctamente los datos del perfil
    await expect(page.getByText('Reparaciones Rápidas')).toBeVisible();

    // 4. Cambiar a la pestaña de Catálogo y verificar productos
    await page.getByRole('button', { name: 'Catálogo' }).click();
    // Esperamos que al menos la primera tarjeta de producto sea visible
    await expect(page.locator('.product-grid-card').first()).toBeVisible();

    // 5. Volver a la pestaña de Publicaciones y verificar la galería
    await page.getByRole('button', { name: 'Publicaciones' }).click();
    // Esperamos que la imagen principal de la galería sea visible
    await expect(page.locator('.publication-gallery-main-image')).toBeVisible();
  });

  test('El usuario puede abrir los detalles de un producto desde el catálogo', async ({ page }) => {
    // 3. Navegar a la pestaña de Catálogo
    await page.getByRole('button', { name: 'Catálogo' }).click();

    // 4. Hacer clic en el primer producto
    await page.locator('.product-grid-card').first().click();

    // 5. Verificar que el diálogo de detalles del producto aparece
    // Buscamos el título del diálogo y un elemento distintivo como el botón "Añadir al Carrito"
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Detalles del Producto' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Añadir al Carrito' })).toBeVisible();
  });
});

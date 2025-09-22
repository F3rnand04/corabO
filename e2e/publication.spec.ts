import { test, expect } from '@playwright/test';

// Este test asume que el usuario ya es un proveedor
// y está logueado. Usaremos un estado de sesión guardado.
test.use({ storageState: 'e2e/.auth/provider.json' });

test.describe('Flujo de Creación de Contenido del Proveedor', () => {

  test.beforeEach(async ({ page }) => {
    // Ir a la página de perfil propia
    await page.goto('/profile');
    // Asegurarse que la página cargó y estamos en la vista de proveedor
    await expect(page.getByRole('button', { name: 'Ajustes' })).toBeVisible();
  });
  
  test('El proveedor puede crear una nueva publicación en su galería', async ({ page }) => {
    // 1. Abrir el diálogo de subida
    const uploadButton = page.locator('footer').getByRole('button').nth(2); // El botón central
    await uploadButton.click();
    
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: '¿Qué quieres añadir?' })).toBeVisible();

    // 2. Elegir 'Publicar en Galería'
    await dialog.getByRole('button', { name: 'Publicar en Galería' }).click();
    await expect(dialog.getByRole('heading', { name: 'Crear Nueva Publicación' })).toBeVisible();

    // 3. Subir un archivo de imagen (usamos un truco para no depender de un archivo físico)
    // Se intercepta el evento de subida y se le pasa un buffer de una imagen dummy.
    const fileChooserPromise = page.waitForEvent('filechooser');
    await dialog.getByText('Haz clic para seleccionar un archivo').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles({
      name: 'test-image.png',
      mimeType: 'image/png',
      buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==', 'base64'),
    });

    // 4. Llenar la descripción
    const description = `Test de publicación ${Date.now()}`;
    await dialog.getByPlaceholder('Añade una descripción...').fill(description);
    
    // 5. Publicar
    await dialog.getByRole('button', { name: 'Publicar en Galería' }).click();

    // 6. Verificar que la publicación aparece en el perfil
    await expect(page.getByText(description)).toBeVisible({ timeout: 10000 });
  });

});

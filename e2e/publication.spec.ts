
import { test, expect } from '@playwright/test';

test.describe('Flujo de Creación de Contenido del Proveedor', () => {

  // Antes de cada prueba en este archivo, iniciamos sesión como proveedor.
  // NOTA: Asumimos que existe un flujo de login para proveedores o usamos un estado guardado.
  // Por ahora, simularemos el login de invitado y navegaremos al perfil.
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Ingresar como Invitado' }).click();
    await expect(page.getByPlaceholder('Buscar por servicio, producto...')).toBeVisible({ timeout: 15000 });
    // Navegamos al perfil propio, que en este contexto de prueba será el de invitado
    await page.getByRole('link', { name: 'Profile' }).click();
    await expect(page.getByRole('button', { name: 'Contactar' })).toBeVisible(); // Una señal de que el perfil cargó
  });

  test('El proveedor puede crear una nueva publicación en su galería', async ({ page }) => {
    // 1. Contar cuántas publicaciones existen inicialmente en la galería.
    const initialCount = await page.locator('.publication-gallery-main-image').count();

    // 2. Hacer clic en el botón de subir contenido (el botón "+" central del footer).
    await page.locator('button[key="central-action"]').click();
    
    // 3. Esperar a que el diálogo de subida aparezca y rellenar el formulario.
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Crear Nueva Publicación' })).toBeVisible();
    
    // Simular la carga de un archivo (Playwright no sube archivos reales, intercepta la petición)
    // Usaremos un archivo de prueba ficticio.
    await page.setInputFiles('input[type="file"]', {
      name: 'test-image.png',
      mimeType: 'image/png',
      buffer: Buffer.from('esto-es-una-imagen-de-prueba', 'utf-8'),
    });

    // Añadir una descripción única para poder encontrarla después.
    const description = `Una publicación de prueba automática ${Math.random()}`;
    await page.getByPlaceholder('Añade una descripción para tu publicación...').fill(description);

    // 4. Enviar el formulario.
    await page.getByRole('button', { name: 'Publicar en Galería' }).click();

    // 5. Verificar que la nueva publicación aparece en la galería.
    // La forma más robusta es esperar a que el número de publicaciones aumente.
    await expect(page.locator('.publication-gallery-main-image')).toHaveCount(initialCount + 1, { timeout: 10000 });
    
    // Opcional: También podríamos hacer clic en la nueva imagen y verificar que la descripción coincida.
    await page.locator('.publication-gallery-main-image').first().click();
    await expect(page.getByText(description)).toBeVisible();
  });

});

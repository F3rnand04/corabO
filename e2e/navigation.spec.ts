import { test, expect } from '@playwright/test';

// Realizar el login antes de cada prueba de este grupo
test.beforeEach(async ({ page }) => {
  await page.goto('/login');
  const guestButton = page.getByRole('button', { name: 'Ingresar como Invitado' });
  await expect(guestButton).toBeVisible({ timeout: 15000 });
  await guestButton.click();
  await expect(page).toHaveURL('/', { timeout: 15000 });
});


test.describe('Navegación y Búsqueda', () => {

  test('El usuario puede navegar a las secciones principales desde el footer', async ({ page }) => {
    // Navegar a la sección de Videos
    await page.getByRole('link', { name: 'Videos' }).click();
    await expect(page.locator('video').first()).toBeVisible();
    await expect(page).toHaveURL('/videos');

    // Navegar a la sección de Mensajes
    await page.getByRole('link', { name: 'Mensajes' }).click();
    await expect(page.getByRole('heading', { name: 'Mensajes' })).toBeVisible();
    await expect(page).toHaveURL('/messages');
    
    // Navegar al Perfil
    await page.getByRole('link', { name: 'Mi Perfil' }).click();
    await expect(page.getByRole('button', { name: 'Ajustes' })).toBeVisible();
  });

  test('La funcionalidad de búsqueda filtra las publicaciones', async ({ page }) => {
    const searchInput = page.getByPlaceholder('Buscar por servicio, producto...');
    
    // Buscar un término específico
    await searchInput.fill('Fisioterapia');
    await searchInput.press('Enter');

    // Esperar a que la búsqueda se complete y el feed se actualice
    await page.waitForTimeout(1000); 

    // Verificar que solo las publicaciones relevantes son visibles
    const feedContainer = page.locator('div.container.mx-auto.max-w-2xl');
    const publicationText = await feedContainer.innerText();
    expect(publicationText).toContain('Fisioterapia');
    expect(publicationText).not.toContain('Desarrollador Web'); 
  });
  
  test('El usuario puede ver una publicación y dejar un comentario', async ({ page }) => {
    // Hacer clic en la primera publicación del feed
    await page.locator('.group.cursor-pointer').first().dblclick();

    // El diálogo de detalles debe aparecer
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    
    // Dejar un comentario
    const commentInput = dialog.getByPlaceholder('Añade un comentario...');
    await commentInput.fill('¡Qué buen servicio!');
    await dialog.getByRole('button', { name: 'Enviar' }).click();
    
    // Verificar que el comentario aparece
    await expect(dialog.getByText('¡Qué buen servicio!')).toBeVisible();
  });

});

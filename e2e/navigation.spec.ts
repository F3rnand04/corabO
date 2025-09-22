import { test, expect } from '@playwright/test';

test.describe('Navegación y Búsqueda', () => {
  // Antes de cada prueba en este archivo, iniciamos sesión como invitado
  // y esperamos a que el feed cargue.
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.getByRole('button', { name: 'Ingresar como Invitado' }).click();
    // Esperamos a que la barra de búsqueda del Header sea visible como señal de que estamos en el feed.
    await expect(page.getByPlaceholder('Buscar por servicio, producto...')).toBeVisible({ timeout: 15000 });
  });

  test('El usuario puede navegar a las secciones principales desde el footer', async ({ page }) => {
    // 1. Navegar a Mensajes
    await page.getByRole('button', { name: 'Messages' }).click(); // Asumiendo que el botón tiene un nombre o aria-label
    await expect(page).toHaveURL('/messages');
    await expect(page.getByRole('heading', { name: 'Mensajes' })).toBeVisible();

    // 2. Navegar al Perfil
    await page.getByRole('link', { name: 'Profile' }).click(); // El avatar es un link al perfil
    await expect(page).toHaveURL('/profile');
    await expect(page.getByRole('heading', { name: 'Invitado' })).toBeVisible(); // Verificar nombre de usuario invitado
  });

  test('La funcionalidad de búsqueda filtra las publicaciones', async ({ page }) => {
    const searchTerm = 'reparación';
    
    // 1. Llenar la barra de búsqueda
    await page.getByPlaceholder('Buscar por servicio, producto...').fill(searchTerm);

    // 2. Enviar la búsqueda (asumiendo que se hace clic en un botón o se presiona Enter)
    await page.keyboard.press('Enter');

    // 3. Verificar que el feed se actualice.
    // Una forma simple es esperar a que una de las publicaciones contenga el término de búsqueda.
    // Esto asume que al menos una publicación de prueba contiene "reparación" en su descripción.
    await expect(page.locator('text=/reparación/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('El usuario puede ver una publicación y dejar un comentario', async ({ page }) => {
    // 1. Hacer clic en la primera publicación del feed
    // Usamos un selector que apunte a la imagen dentro de la tarjeta de publicación.
    await page.locator('.publication-card img').first().click();

    // 2. Verificar que se navega a la página de detalles de la publicación
    await expect(page).toHaveURL(/\/publications\/.+/);
    await expect(page.getByRole('heading', { name: 'Comentarios' })).toBeVisible();

    // 3. Escribir y enviar un comentario
    const commentText = `¡Un comentario de prueba! ${Math.random()}`;
    await page.getByPlaceholder('Añade un comentario...').fill(commentText);
    await page.getByRole('button', { name: 'Comentar' }).click();

    // 4. Verificar que el comentario aparece en la página
    await expect(page.locator(`text=${commentText}`)).toBeVisible();
  });
});

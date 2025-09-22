import { test, expect } from '@playwright/test';

// Asumimos que este ID corresponde a un proveedor de servicios en la data de prueba
const providerId = 'gJc8S5aYmwe1s3X9uA172h3j5k0';

test.beforeEach(async ({ page }) => {
  // Iniciar sesión como invitado
  await page.goto('/login');
  const guestButton = page.getByRole('button', { name: 'Ingresar como Invitado' });
  await expect(guestButton).toBeVisible({ timeout: 15000 });
  await guestButton.click();
  
  // Navegar directamente al perfil del proveedor
  await page.goto(`/companies/${providerId}`);
  await expect(page.getByText('Fisioterapeuta')).toBeVisible(); // Asegurarse que el perfil cargó
});


test.describe('Página de Perfil del Proveedor', () => {

  test('El usuario puede ver el perfil y cambiar entre pestañas', async ({ page }) => {
    // Verificar que la pestaña de Publicaciones está activa por defecto
    const publicationsTab = page.getByRole('button', { name: 'Publicaciones' });
    await expect(publicationsTab).toHaveClass(/border-primary/);

    // Cambiar a la pestaña de Catálogo
    const catalogTab = page.getByRole('button', { name: 'Catálogo' });
    await catalogTab.click();
    await expect(catalogTab).toHaveClass(/border-primary/);
    
    // Verificar que se muestra el contenido del catálogo (ej. un producto)
    await expect(page.getByText('Terapia Manual')).toBeVisible();
  });


  test('El usuario puede abrir los detalles de un producto desde el catálogo', async ({ page }) => {
     // Ir a la pestaña de catálogo
    await page.getByRole('button', { name: 'Catálogo' }).click();

    // Hacer doble clic en una tarjeta de producto
    await page.getByText('Terapia Manual').dblclick();
    
    // Verificar que el diálogo de detalles del producto se abre
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole('heading', { name: 'Terapia Manual' })).toBeVisible();

    // Verificar que se puede añadir al carrito
    const addToCartButton = dialog.getByRole('button', { name: 'Añadir al Carrito' });
    await expect(addToCartButton).toBeEnabled();
  });

});

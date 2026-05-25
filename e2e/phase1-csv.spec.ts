import { test, expect } from '@playwright/test';
import { resolve } from 'node:path';

test('Phase 1 CSV flow imports and displays normalized products', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Normalisez|Normalize/i })).toBeVisible();

  await page.getByRole('button', { name: 'EN' }).click();
  await expect(page.getByRole('link', { name: /Create project/i })).toBeVisible();
  await page.getByRole('button', { name: 'FR' }).click();
  await expect(page.getByRole('link', { name: 'Créer un projet', exact: true })).toBeVisible();

  await page.getByRole('link', { name: /Créer un projet CSV/i }).click();
  await page.getByLabel('Nom du projet').fill(`E2E CSV ${Date.now()}`);
  await page.getByLabel('Langue principale').fill('fr');
  await page.getByLabel('Pays cible').fill('FR');
  await page.getByLabel('Devise').fill('EUR');
  await page.getByRole('button', { name: /^Créer$/ }).click();

  await expect(page.getByRole('heading', { name: /Importer le fichier CSV/i })).toBeVisible();
  await page.locator('#csv-file').setInputFiles(resolve('backend-nest/test/fixtures/products-phase1.csv'));
  await page.getByRole('button', { name: /Analyser le CSV/i }).click();

  await expect(page.getByRole('heading', { name: /Aperçu CSV/i })).toBeVisible();
  await expect(page.getByText('nom_produit').first()).toBeVisible();
  await expect(page.getByText('prix_ttc').first()).toBeVisible();
  await page.getByRole('link', { name: /Continuer vers le mapping/i }).click();

  await expect(page.getByRole('heading', { name: /Mapping des colonnes/i })).toBeVisible();
  await expect(page.getByText('title OK')).toBeVisible();
  await expect(page.getByLabel('nom_produit')).toHaveValue('title');
  await expect(page.getByLabel('prix_ttc')).toHaveValue('price');
  await expect(page.getByLabel('url_fiche')).toHaveValue('url');
  await page.getByRole('button', { name: /Enregistrer le mapping et importer/i }).click();

  await expect(page.getByRole('heading', { name: /Produits normalisés/i })).toBeVisible();
  await expect(page.locator('tbody tr')).toHaveCount(8);
  await expect(page.getByText('Gourde inox 750 ml')).toBeVisible();
  await expect(page.getByText('Lampe LED bureau')).toBeVisible();
  await expect(page.getByText(/24[,.]90/).first()).toBeVisible();
  await expect(page.getByRole('link', { name: 'https://example.com/gourde-750' })).toBeVisible();
  await expect(page.getByText('in_stock').first()).toBeVisible();
  await expect(page.getByText('preorder').first()).toBeVisible();
});

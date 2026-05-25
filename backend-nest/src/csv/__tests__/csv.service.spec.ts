import { CsvService } from '../csv.service';

describe('CsvService', () => {
  const service = new CsvService({} as any);
  test.each([
    ['semicolon', 'a;b\n1;2', ';'],
    ['comma', 'a,b\n1,2', ','],
    ['tab', 'a\tb\n1\t2', '\t'],
  ])('detects %s delimiter', (_name, content, delimiter) => { expect(service.detectDelimiter(content)).toBe(delimiter); });
  test('parse csv with utf-8 accents, quoted commas, and price formats', () => {
    const rows = service.parseCsv('title,description,price_dot,price_comma\nÉtagère,"Bois, métal",24.90,"39,99"', ',');
    expect(rows[0].title).toBe('Étagère');
    expect(rows[0].description).toBe('Bois, métal');
    expect(rows[0].price_dot).toBe('24.90');
    expect(rows[0].price_comma).toBe('39,99');
  });
  test('auto mapping', () => { const m = service.proposeMapping(['nom', 'prix']); expect(m.nom).toBe('title'); expect(m.prix).toBe('price'); });
  test('auto maps phase 1 product columns', () => {
    const m = service.proposeMapping([
      'nom_produit',
      'description_longue',
      'prix_ttc',
      'sku',
      'marque',
      'categorie',
      'url_fiche',
      'stock',
      'ean13',
      'image_url',
      'mots_cles',
      'référence',
      'catégorie',
      'disponibilité',
      'mots-clés',
      'titre_seo',
      'description_seo',
    ]);
    expect(m.nom_produit).toBe('title');
    expect(m.description_longue).toBe('description');
    expect(m.prix_ttc).toBe('price');
    expect(m.sku).toBe('sku');
    expect(m.marque).toBe('brand');
    expect(m.categorie).toBe('category');
    expect(m.url_fiche).toBe('url');
    expect(m.stock).toBe('availability');
    expect(m.ean13).toBe('gtin');
    expect(m.image_url).toBe('imageUrls');
    expect(m.mots_cles).toBe('tags');
    expect(m['référence']).toBe('sku');
    expect(m['catégorie']).toBe('category');
    expect(m['disponibilité']).toBe('availability');
    expect(m['mots-clés']).toBe('tags');
    expect(m.titre_seo).toBe('seoTitle');
    expect(m.description_seo).toBe('metaDescription');
  });
  test('mapping validation requires title', async () => {
    const create = jest.fn();
    const svc = new CsvService({ csvColumnMapping: { create } } as any);
    await expect(svc.saveMapping('p1', 'i1', { prix_ttc: 'price' })).rejects.toMatchObject({
      response: expect.objectContaining({ code: 'CSV_MAPPING_MISSING_TITLE' }),
    });
    expect(create).not.toHaveBeenCalled();
  });
  test('mapping validation saves mapping when title is present', async () => {
    const create = jest.fn(async ({ data }) => ({ id: 'm1', ...data }));
    const svc = new CsvService({ csvColumnMapping: { create } } as any);
    await expect(svc.saveMapping('p1', 'i1', { nom_produit: 'title', prix_ttc: 'price' })).resolves.toMatchObject({ id: 'm1' });
    expect(create).toHaveBeenCalledWith({
      data: { projectId: 'p1', csvImportId: 'i1', mapping: { nom_produit: 'title', prix_ttc: 'price' } },
    });
  });
});

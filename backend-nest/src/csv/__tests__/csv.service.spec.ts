import { CsvService } from '../csv.service';

describe('CsvService', () => {
  const service = new CsvService({} as any);
  test('detect delimiter', () => { expect(service.detectDelimiter('a;b\n1;2')).toBe(';'); });
  test('parse csv', () => { const rows = service.parseCsv('title,price\nA,12', ','); expect(rows[0].title).toBe('A'); });
  test('auto mapping', () => { const m = service.proposeMapping(['nom', 'prix']); expect(m.nom).toBe('title'); expect(m.prix).toBe('price'); });
});

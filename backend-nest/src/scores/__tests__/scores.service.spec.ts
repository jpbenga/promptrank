import { ScoresService } from '../scores.service';

describe('ScoresService', () => {
  const service = new ScoresService({} as any);

  const run = (overrides: any = {}) => ({
    id: overrides.id || 'run-1',
    productId: overrides.productId || 'product-1',
    brandMentioned: overrides.brandMentioned ?? true,
    productMentioned: overrides.productMentioned ?? true,
    competitorsMentioned: overrides.competitorsMentioned ?? [],
    position: Object.prototype.hasOwnProperty.call(overrides, 'position') ? overrides.position : 1,
    sentiment: overrides.sentiment ?? 'positive',
  });

  it('can score 100 with brand, product, first position, positive sentiment and no competitors', () => {
    expect(service.scoreRun(run())).toBe(100);
  });

  it('penalizes competitor mentions', () => {
    expect(service.scoreRun(run({ competitorsMentioned: ['Stanley', 'Nike', 'Adidas'] }))).toBe(94);
  });

  it('penalizes negative sentiment', () => {
    expect(service.scoreRun(run({ sentiment: 'negative' }))).toBe(80);
  });

  it('keeps run scores between 0 and 100', () => {
    expect(service.scoreRun(run())).toBe(100);
    expect(service.scoreRun(run({
      brandMentioned: false,
      productMentioned: false,
      competitorsMentioned: ['a', 'b', 'c', 'd', 'e', 'f'],
      position: null,
      sentiment: 'negative',
    }))).toBe(0);
  });

  it('calculates rates correctly', () => {
    const aggregate = service.aggregateRuns([
      run({ id: 'run-1', brandMentioned: true, productMentioned: true, competitorsMentioned: ['Nike'] }),
      run({ id: 'run-2', brandMentioned: false, productMentioned: true, competitorsMentioned: [] }),
      run({ id: 'run-3', brandMentioned: false, productMentioned: false, competitorsMentioned: [] }),
    ]);

    expect(aggregate.brandMentionRate).toBe(0.333);
    expect(aggregate.productMentionRate).toBe(0.667);
    expect(aggregate.competitorMentionRate).toBe(0.333);
  });

  it('sorts top competitors by frequency then name', () => {
    const aggregate = service.aggregateRuns([
      run({ id: 'run-1', competitorsMentioned: ['Nike', 'Stanley'] }),
      run({ id: 'run-2', competitorsMentioned: ['Nike', 'Adidas'] }),
      run({ id: 'run-3', competitorsMentioned: ['Adidas'] }),
    ]);

    expect(aggregate.topCompetitors).toEqual(['Adidas', 'Nike', 'Stanley']);
  });

  it('calculates average position from available positions', () => {
    const aggregate = service.aggregateRuns([
      run({ id: 'run-1', position: 1 }),
      run({ id: 'run-2', position: 3 }),
      run({ id: 'run-3', position: null }),
    ]);

    expect(aggregate.averagePosition).toBe(2);
  });

  it('calculates dominant sentiment deterministically', () => {
    const aggregate = service.aggregateRuns([
      run({ id: 'run-1', sentiment: 'negative' }),
      run({ id: 'run-2', sentiment: 'neutral' }),
      run({ id: 'run-3', sentiment: 'negative' }),
    ]);

    expect(aggregate.dominantSentiment).toBe('negative');
  });
});

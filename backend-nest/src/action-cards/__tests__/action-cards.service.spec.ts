import { ActionCardsService } from '../action-cards.service';

describe('ActionCardsService', () => {
  const service = new ActionCardsService({} as any);

  const score = (overrides: any = {}) => ({
    id: overrides.id || 'score-1',
    projectId: overrides.projectId || 'project-1',
    productId: Object.prototype.hasOwnProperty.call(overrides, 'productId') ? overrides.productId : 'product-1',
    scope: overrides.scope || 'product',
    score: overrides.score ?? 30,
    analyzedPromptsCount: overrides.analyzedPromptsCount ?? 3,
    brandMentionRate: overrides.brandMentionRate ?? 0.8,
    productMentionRate: overrides.productMentionRate ?? 0.8,
    competitorMentionRate: overrides.competitorMentionRate ?? 0,
    averagePosition: Object.prototype.hasOwnProperty.call(overrides, 'averagePosition') ? overrides.averagePosition : 1,
    dominantSentiment: overrides.dominantSentiment || 'positive',
    topCompetitors: overrides.topCompetitors ?? [],
    details: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  it('generates a high priority action for a weak product score', () => {
    const cards = service.generateCandidates('project-1', [score({ score: 30 }) as any]);
    expect(cards).toEqual(expect.arrayContaining([expect.objectContaining({
      category: 'description',
      priority: 'high',
      status: 'open',
      reason: 'Le score de visibilité est faible.',
    })]));
  });

  it('generates a brand action when brandMentionRate is low', () => {
    const cards = service.generateCandidates('project-1', [score({ score: 60, brandMentionRate: 0.3 }) as any]);
    expect(cards).toEqual(expect.arrayContaining([expect.objectContaining({ category: 'brand' })]));
  });

  it('generates a title action when productMentionRate is low', () => {
    const cards = service.generateCandidates('project-1', [score({ score: 60, productMentionRate: 0.2 }) as any]);
    expect(cards).toEqual(expect.arrayContaining([expect.objectContaining({ category: 'title' })]));
  });

  it('generates a comparison action when competitors are highly present', () => {
    const cards = service.generateCandidates('project-1', [score({ score: 60, competitorMentionRate: 0.8, topCompetitors: ['Nike'] }) as any]);
    expect(cards).toEqual(expect.arrayContaining([expect.objectContaining({ category: 'comparison' })]));
  });

  it('generates a high priority action for negative sentiment', () => {
    const cards = service.generateCandidates('project-1', [score({ score: 60, dominantSentiment: 'negative' }) as any]);
    expect(cards).toEqual(expect.arrayContaining([expect.objectContaining({
      category: 'content',
      priority: 'high',
      reason: 'Le sentiment dominant est négatif.',
    })]));
  });

  it('generates a project-level action when project score is weak', () => {
    const cards = service.generateCandidates('project-1', [score({ id: 'project-score', productId: null, scope: 'project', score: 45 }) as any]);
    expect(cards).toEqual([expect.objectContaining({ productId: null, priority: 'high' })]);
  });

  it('generates no more than five cards per product', () => {
    const cards = service.generateCandidates('project-1', [score({
      score: 20,
      brandMentionRate: 0,
      productMentionRate: 0,
      competitorMentionRate: 1,
      topCompetitors: ['Nike'],
      dominantSentiment: 'negative',
      averagePosition: null,
    }) as any]);
    expect(cards.filter(card => card.productId === 'product-1')).toHaveLength(5);
  });

  it('generates no more than thirty cards per project', () => {
    const scores = Array.from({ length: 10 }, (_, index) => score({
      id: `score-${index}`,
      productId: `product-${index}`,
      score: 20,
      brandMentionRate: 0,
      productMentionRate: 0,
      competitorMentionRate: 1,
      topCompetitors: ['Nike'],
      dominantSentiment: 'negative',
      averagePosition: null,
    }) as any);

    expect(service.generateCandidates('project-1', scores)).toHaveLength(30);
  });

  it('deduplicates exact cards for the same project, product, category and reason', () => {
    const cards = service.generateCandidates('project-1', [
      score({ id: 'score-a', productId: 'product-1', score: 30 }) as any,
      score({ id: 'score-b', productId: 'product-1', score: 30 }) as any,
    ]);
    const lowScoreCards = cards.filter(card => card.reason === 'Le score de visibilité est faible.');
    expect(lowScoreCards).toHaveLength(1);
  });

  it('sets generated card status to open', () => {
    const cards = service.generateCandidates('project-1', [score({ score: 30 }) as any]);
    expect(cards.every(card => card.status === 'open')).toBe(true);
  });
});

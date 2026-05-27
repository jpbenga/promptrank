import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type {
  ActionCard,
  ActionCardCategory,
  ActionCardEffort,
  ActionCardImpact,
  ActionCardPriority,
  ActionCardStatus,
  GenerateActionCardsResponse,
  UpdateActionCardRequest,
  VisibilityScoreSentiment,
} from '@promptrank/shared-types';
import type { ActionCard as PrismaActionCard, VisibilityScore as PrismaVisibilityScore } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';

type CardCandidate = {
  projectId: string;
  productId: string | null;
  scoreId: string | null;
  title: string;
  description: string;
  category: ActionCardCategory;
  priority: ActionCardPriority;
  status: ActionCardStatus;
  impact: ActionCardImpact;
  effort: ActionCardEffort;
  reason: string;
  recommendation: string;
  metadata: Record<string, unknown>;
};

@Injectable()
export class ActionCardsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly maxCardsPerProduct = 5;
  private readonly maxCardsPerProject = 30;
  private readonly validStatuses: readonly ActionCardStatus[] = ['open', 'done', 'dismissed'];

  async generate(projectId: string): Promise<GenerateActionCardsResponse> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException({ code: 'PROJECT_NOT_FOUND', message: 'Project not found' });

    const scores = await this.prisma.visibilityScore.findMany({ where: { projectId }, orderBy: [{ scope: 'asc' }, { score: 'asc' }] });
    if (!scores.length) throw new BadRequestException({ code: 'ACTION_CARDS_NO_SCORES', message: 'No visibility scores available' });

    try {
      const existing = await this.prisma.actionCard.findMany({ where: { projectId } });
      const existingKeys = new Set(existing.map(card => this.dedupeKey(card)));
      const candidates = this.generateCandidates(projectId, scores)
        .filter(card => !existingKeys.has(this.dedupeKey(card)))
        .slice(0, this.maxCardsPerProject);

      const created: ActionCard[] = [];
      for (const candidate of candidates) {
        const card = await this.prisma.actionCard.create({
          data: {
            ...candidate,
            metadata: candidate.metadata as any,
          },
        });
        created.push(this.toActionCardDto(card));
      }

      return this.toGenerateResponse(created);
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      throw new BadRequestException({ code: 'ACTION_CARDS_GENERATION_FAILED', message: 'Action cards generation failed' });
    }
  }

  async list(projectId: string): Promise<ActionCard[]> {
    const cards = await this.prisma.actionCard.findMany({ where: { projectId }, orderBy: [{ status: 'asc' }, { priority: 'asc' }, { createdAt: 'desc' }] });
    return cards.map(card => this.toActionCardDto(card));
  }

  async listProduct(projectId: string, productId: string): Promise<ActionCard[]> {
    const cards = await this.prisma.actionCard.findMany({ where: { projectId, productId }, orderBy: [{ status: 'asc' }, { priority: 'asc' }, { createdAt: 'desc' }] });
    return cards.map(card => this.toActionCardDto(card));
  }

  async update(projectId: string, actionCardId: string, body: UpdateActionCardRequest): Promise<ActionCard> {
    const card = await this.prisma.actionCard.findFirst({ where: { id: actionCardId, projectId } });
    if (!card) throw new NotFoundException({ code: 'ACTION_CARD_NOT_FOUND', message: 'Action card not found' });

    const data: Partial<Pick<PrismaActionCard, 'status' | 'title' | 'description' | 'recommendation'>> = {};
    if (body.status !== undefined) {
      if (!this.validStatuses.includes(body.status)) throw new BadRequestException({ code: 'ACTION_CARD_UPDATE_INVALID', message: 'Invalid action card status' });
      data.status = body.status;
    }
    if (body.title !== undefined) data.title = this.cleanedText(body.title);
    if (body.description !== undefined) data.description = this.cleanedText(body.description);
    if (body.recommendation !== undefined) data.recommendation = this.cleanedText(body.recommendation);

    if (!Object.keys(data).length || Object.values(data).some(value => !value)) {
      throw new BadRequestException({ code: 'ACTION_CARD_UPDATE_INVALID', message: 'Invalid action card update' });
    }

    const updated = await this.prisma.actionCard.update({ where: { id: actionCardId }, data });
    return this.toActionCardDto(updated);
  }

  generateCandidates(projectId: string, scores: PrismaVisibilityScore[]): CardCandidate[] {
    const cards: CardCandidate[] = [];
    const seen = new Set<string>();
    const productCardCounts = new Map<string, number>();
    const projectScores = scores.filter(score => score.scope === 'project');
    const productScores = scores.filter(score => score.scope === 'product').sort((a, b) => a.score - b.score || (a.productId || '').localeCompare(b.productId || ''));

    for (const score of projectScores) {
      if (score.score < 50) {
        this.pushUnique(cards, seen, {
          projectId,
          productId: null,
          scoreId: score.id,
          title: 'Prioriser les produits les moins visibles',
          description: 'Le score projet indique une visibilité globale insuffisante.',
          category: 'content',
          priority: 'high',
          status: 'open',
          impact: 'high',
          effort: 'medium',
          reason: 'Le score projet est inférieur à 50.',
          recommendation: 'Prioriser les produits avec les scores les plus faibles et les concurrents les plus fréquents.',
          metadata: this.scoreMetadata(score, 'project_low_score'),
        });
      }
    }

    for (const score of productScores) {
      const productId = score.productId;
      if (!productId) continue;
      const candidates = this.productCandidates(projectId, score);
      for (const candidate of candidates) {
        const count = productCardCounts.get(productId) || 0;
        if (count >= this.maxCardsPerProduct || cards.length >= this.maxCardsPerProject) break;
        if (this.pushUnique(cards, seen, candidate)) productCardCounts.set(productId, count + 1);
      }
      if (cards.length >= this.maxCardsPerProject) break;
    }

    return cards.slice(0, this.maxCardsPerProject);
  }

  private productCandidates(projectId: string, score: PrismaVisibilityScore): CardCandidate[] {
    const productId = score.productId;
    if (!productId) return [];
    const topCompetitors = this.topCompetitors(score);
    const sentiment = this.sentiment(score.dominantSentiment);
    const cards: CardCandidate[] = [];

    if (score.score < 40) {
      cards.push({
        projectId,
        productId,
        scoreId: score.id,
        title: 'Améliorer la visibilité produit',
        description: 'Le produit ressort faiblement dans les réponses simulées.',
        category: 'description',
        priority: 'high',
        status: 'open',
        impact: 'high',
        effort: 'medium',
        reason: 'Le score de visibilité est faible.',
        recommendation: 'Enrichir la fiche produit avec des attributs clairs, des bénéfices et des usages concrets.',
        metadata: this.scoreMetadata(score, 'product_low_score'),
      });
    }

    if (score.brandMentionRate < 0.5) {
      cards.push({
        projectId,
        productId,
        scoreId: score.id,
        title: 'Renforcer la présence de la marque',
        description: 'La marque est trop peu mentionnée dans les analyses simulées.',
        category: 'brand',
        priority: score.brandMentionRate < 0.25 ? 'high' : 'medium',
        status: 'open',
        impact: 'high',
        effort: 'low',
        reason: 'Le taux de mention marque est inférieur à 50%.',
        recommendation: 'Renforcer la présence de la marque dans le titre, la description ou les contenus associés.',
        metadata: this.scoreMetadata(score, 'low_brand_mention_rate'),
      });
    }

    if (score.productMentionRate < 0.4) {
      cards.push({
        projectId,
        productId,
        scoreId: score.id,
        title: 'Clarifier le nom et les bénéfices produit',
        description: 'Le produit est trop peu identifié dans les réponses simulées.',
        category: 'title',
        priority: score.productMentionRate < 0.2 ? 'high' : 'medium',
        status: 'open',
        impact: 'high',
        effort: 'medium',
        reason: 'Le taux de mention produit est inférieur à 40%.',
        recommendation: 'Clarifier le nom produit, les bénéfices principaux et les cas d’usage.',
        metadata: this.scoreMetadata(score, 'low_product_mention_rate'),
      });
    }

    if (score.competitorMentionRate > 0.5 || (topCompetitors.length > 0 && score.competitorMentionRate >= 0.4)) {
      cards.push({
        projectId,
        productId,
        scoreId: score.id,
        title: 'Créer un contenu comparatif',
        description: 'Des concurrents apparaissent fortement dans les réponses simulées.',
        category: 'comparison',
        priority: score.competitorMentionRate > 0.75 ? 'high' : 'medium',
        status: 'open',
        impact: 'medium',
        effort: 'medium',
        reason: `Les concurrents détectés sont présents: ${topCompetitors.join(', ') || 'non renseigné'}.`,
        recommendation: 'Créer du contenu comparatif avec les concurrents détectés et expliciter les différenciants.',
        metadata: { ...this.scoreMetadata(score, 'high_competitor_presence'), topCompetitors },
      });
    }

    if (sentiment === 'negative') {
      cards.push({
        projectId,
        productId,
        scoreId: score.id,
        title: 'Améliorer les preuves produit',
        description: 'Le sentiment dominant est négatif.',
        category: 'content',
        priority: 'high',
        status: 'open',
        impact: 'high',
        effort: 'medium',
        reason: 'Le sentiment dominant est négatif.',
        recommendation: 'Retravailler les preuves, bénéfices et différenciants produit.',
        metadata: this.scoreMetadata(score, 'negative_sentiment'),
      });
    } else if (sentiment === 'neutral') {
      cards.push({
        projectId,
        productId,
        scoreId: score.id,
        title: 'Rendre les bénéfices plus explicites',
        description: 'Le sentiment dominant reste neutre.',
        category: 'content',
        priority: 'medium',
        status: 'open',
        impact: 'medium',
        effort: 'low',
        reason: 'Le sentiment dominant est neutre.',
        recommendation: 'Ajouter des bénéfices plus explicites et des éléments de réassurance.',
        metadata: this.scoreMetadata(score, 'neutral_sentiment'),
      });
    }

    if (score.averagePosition === null || score.averagePosition > 2) {
      cards.push({
        projectId,
        productId,
        scoreId: score.id,
        title: 'Renforcer les signaux de pertinence',
        description: 'La position moyenne du produit est faible ou non détectée.',
        category: 'content',
        priority: score.averagePosition === null ? 'high' : 'medium',
        status: 'open',
        impact: 'medium',
        effort: 'medium',
        reason: 'La position moyenne est supérieure à 2 ou non disponible.',
        recommendation: 'Renforcer les signaux de pertinence produit dans les attributs, usages et preuves.',
        metadata: this.scoreMetadata(score, 'weak_average_position'),
      });
    }

    return cards;
  }

  private pushUnique(cards: CardCandidate[], seen: Set<string>, candidate: CardCandidate): boolean {
    const key = this.dedupeKey(candidate);
    if (seen.has(key)) return false;
    seen.add(key);
    cards.push(candidate);
    return true;
  }

  private dedupeKey(card: { projectId: string; productId: string | null; category: string; reason: string }) {
    return [card.projectId, card.productId || 'project', card.category, card.reason].join('|').toLowerCase();
  }

  private topCompetitors(score: PrismaVisibilityScore): string[] {
    return Array.isArray(score.topCompetitors) ? score.topCompetitors.map(String).filter(Boolean) : [];
  }

  private sentiment(value: string): VisibilityScoreSentiment {
    return ['positive', 'neutral', 'negative', 'unknown'].includes(value) ? value as VisibilityScoreSentiment : 'unknown';
  }

  private scoreMetadata(score: PrismaVisibilityScore, rule: string) {
    return {
      rule,
      score: score.score,
      scope: score.scope,
      analyzedPromptsCount: score.analyzedPromptsCount,
      brandMentionRate: score.brandMentionRate,
      productMentionRate: score.productMentionRate,
      competitorMentionRate: score.competitorMentionRate,
      averagePosition: score.averagePosition,
      dominantSentiment: score.dominantSentiment,
    };
  }

  private cleanedText(value: string) {
    return value.trim().replace(/\s+/g, ' ');
  }

  private toGenerateResponse(cards: ActionCard[]): GenerateActionCardsResponse {
    const projectCards = cards.filter(card => !card.productId);
    const cardsByProduct: Record<string, ActionCard[]> = {};
    for (const card of cards.filter(item => item.productId)) {
      const productId = card.productId!;
      cardsByProduct[productId] = cardsByProduct[productId] || [];
      cardsByProduct[productId].push(card);
    }
    return { cards, projectCards, cardsByProduct, generatedCount: cards.length };
  }

  private toActionCardDto(card: PrismaActionCard): ActionCard {
    return {
      id: card.id,
      projectId: card.projectId,
      productId: card.productId,
      scoreId: card.scoreId,
      title: card.title,
      description: card.description,
      category: card.category as ActionCardCategory,
      priority: card.priority as ActionCardPriority,
      status: card.status as ActionCardStatus,
      impact: card.impact as ActionCardImpact,
      effort: card.effort as ActionCardEffort,
      reason: card.reason,
      recommendation: card.recommendation,
      metadata: card.metadata && typeof card.metadata === 'object' && !Array.isArray(card.metadata) ? card.metadata as Record<string, unknown> : {},
      createdAt: card.createdAt.toISOString(),
      updatedAt: card.updatedAt.toISOString(),
    };
  }
}

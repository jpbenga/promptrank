import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import type { ComputeScoresResponse, ProductVisibilityScore, ProjectVisibilityScore, VisibilityScore, VisibilityScoreSentiment } from '@promptrank/shared-types';
import type { PromptRun as PrismaPromptRun, VisibilityScore as PrismaVisibilityScore } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';

type RunInput = Pick<PrismaPromptRun, 'id' | 'productId' | 'brandMentioned' | 'productMentioned' | 'competitorsMentioned' | 'position' | 'sentiment'>;

type AggregatedScore = {
  score: number;
  analyzedPromptsCount: number;
  brandMentionRate: number;
  productMentionRate: number;
  competitorMentionRate: number;
  averagePosition: number | null;
  dominantSentiment: VisibilityScoreSentiment;
  topCompetitors: string[];
  details: Record<string, unknown>;
};

@Injectable()
export class ScoresService {
  constructor(private readonly prisma: PrismaService) {}

  scoreRun(run: RunInput): number {
    const competitors = this.competitors(run);
    let score = 5;
    if (run.brandMentioned) score += 35;
    if (run.productMentioned) score += 35;
    if (run.position === 1) score += 15;
    else if (run.position === 2) score += 10;
    else if (run.position === 3) score += 5;
    if (run.sentiment === 'positive') score += 10;
    else if (run.sentiment === 'neutral') score += 5;
    else if (run.sentiment === 'negative') score -= 10;
    score -= Math.min(10, competitors.length * 2);
    return Math.max(0, Math.min(100, score));
  }

  aggregateRuns(runs: RunInput[], details: Record<string, unknown> = {}): AggregatedScore {
    const count = runs.length;
    const runScores = runs.map(run => ({ promptRunId: run.id, score: this.scoreRun(run) }));
    const positions = runs.map(run => run.position).filter((position): position is number => position !== null && position !== undefined);
    const competitorFrequency = new Map<string, number>();
    for (const run of runs) {
      for (const competitor of this.competitors(run)) {
        competitorFrequency.set(competitor, (competitorFrequency.get(competitor) || 0) + 1);
      }
    }

    return {
      score: Math.round(runScores.reduce((sum, item) => sum + item.score, 0) / count),
      analyzedPromptsCount: count,
      brandMentionRate: this.rate(runs.filter(run => run.brandMentioned).length, count),
      productMentionRate: this.rate(runs.filter(run => run.productMentioned).length, count),
      competitorMentionRate: this.rate(runs.filter(run => this.competitors(run).length > 0).length, count),
      averagePosition: positions.length ? this.roundMetric(positions.reduce((sum, position) => sum + position, 0) / positions.length) : null,
      dominantSentiment: this.dominantSentiment(runs),
      topCompetitors: [...competitorFrequency.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([name]) => name),
      details: { ...details, runScores },
    };
  }

  async compute(projectId: string): Promise<ComputeScoresResponse> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException({ code: 'PROJECT_NOT_FOUND', message: 'Project not found' });

    const runs = await this.prisma.promptRun.findMany({ where: { projectId, status: 'completed' }, orderBy: { createdAt: 'asc' } });
    if (!runs.length) throw new BadRequestException({ code: 'SCORE_NO_PROMPT_RUNS', message: 'No analysis runs available' });

    try {
      const runsByProduct = new Map<string, PrismaPromptRun[]>();
      for (const run of runs) {
        const current = runsByProduct.get(run.productId) || [];
        current.push(run);
        runsByProduct.set(run.productId, current);
      }

      await this.prisma.visibilityScore.deleteMany({ where: { projectId } });

      const productScores: ProductVisibilityScore[] = [];
      for (const [productId, productRuns] of runsByProduct.entries()) {
        const aggregate = this.aggregateRuns(productRuns, { scope: 'product', productId });
        const saved = await this.prisma.visibilityScore.create({
          data: {
            projectId,
            productId,
            scope: 'product',
            ...aggregate,
            topCompetitors: aggregate.topCompetitors as any,
            details: aggregate.details as any,
          },
        });
        productScores.push(this.toVisibilityScoreDto(saved) as ProductVisibilityScore);
      }

      const projectAggregate = this.aggregateProjectRuns(runs, productScores);
      const savedProject = await this.prisma.visibilityScore.create({
        data: {
          projectId,
          productId: null,
          scope: 'project',
          ...projectAggregate,
          topCompetitors: projectAggregate.topCompetitors as any,
          details: projectAggregate.details as any,
        },
      });

      return {
        projectScore: this.toVisibilityScoreDto(savedProject) as ProjectVisibilityScore,
        productScores: productScores.sort((a, b) => b.score - a.score || a.productId.localeCompare(b.productId)),
      };
    } catch (error) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) throw error;
      throw new BadRequestException({ code: 'SCORE_COMPUTE_FAILED', message: 'Score compute failed' });
    }
  }

  async list(projectId: string): Promise<VisibilityScore[]> {
    const scores = await this.prisma.visibilityScore.findMany({ where: { projectId }, orderBy: [{ scope: 'asc' }, { score: 'desc' }] });
    return scores.map(score => this.toVisibilityScoreDto(score));
  }

  async getProjectScore(projectId: string): Promise<ProjectVisibilityScore | null> {
    const score = await this.prisma.visibilityScore.findFirst({ where: { projectId, scope: 'project' }, orderBy: { updatedAt: 'desc' } });
    return score ? this.toVisibilityScoreDto(score) as ProjectVisibilityScore : null;
  }

  async getProductScore(projectId: string, productId: string): Promise<ProductVisibilityScore | null> {
    const score = await this.prisma.visibilityScore.findFirst({ where: { projectId, productId, scope: 'product' }, orderBy: { updatedAt: 'desc' } });
    return score ? this.toVisibilityScoreDto(score) as ProductVisibilityScore : null;
  }

  private aggregateProjectRuns(runs: PrismaPromptRun[], productScores: ProductVisibilityScore[]): AggregatedScore {
    const aggregate = this.aggregateRuns(runs, { scope: 'project', productCount: productScores.length });
    aggregate.score = Math.round(productScores.reduce((sum, score) => sum + score.score, 0) / productScores.length);
    aggregate.details = {
      ...aggregate.details,
      productScores: productScores.map(score => ({ productId: score.productId, score: score.score })),
    };
    return aggregate;
  }

  private competitors(run: Pick<RunInput, 'competitorsMentioned'>): string[] {
    return Array.isArray(run.competitorsMentioned) ? run.competitorsMentioned.map(String).filter(Boolean) : [];
  }

  private dominantSentiment(runs: RunInput[]): VisibilityScoreSentiment {
    const order: VisibilityScoreSentiment[] = ['positive', 'neutral', 'negative', 'unknown'];
    const counts = new Map<VisibilityScoreSentiment, number>(order.map(sentiment => [sentiment, 0]));
    for (const run of runs) {
      const sentiment = order.includes(run.sentiment as VisibilityScoreSentiment) ? run.sentiment as VisibilityScoreSentiment : 'unknown';
      counts.set(sentiment, (counts.get(sentiment) || 0) + 1);
    }
    return order.sort((a, b) => (counts.get(b) || 0) - (counts.get(a) || 0))[0];
  }

  private rate(value: number, total: number) {
    return this.roundMetric(total ? value / total : 0);
  }

  private roundMetric(value: number) {
    return Math.round(value * 1000) / 1000;
  }

  private toVisibilityScoreDto(score: PrismaVisibilityScore): VisibilityScore {
    return {
      id: score.id,
      projectId: score.projectId,
      productId: score.productId,
      scope: score.scope as 'project' | 'product',
      score: score.score,
      analyzedPromptsCount: score.analyzedPromptsCount,
      brandMentionRate: score.brandMentionRate,
      productMentionRate: score.productMentionRate,
      competitorMentionRate: score.competitorMentionRate,
      averagePosition: score.averagePosition ?? null,
      dominantSentiment: score.dominantSentiment as VisibilityScoreSentiment,
      topCompetitors: Array.isArray(score.topCompetitors) ? score.topCompetitors.map(String) : [],
      details: score.details && typeof score.details === 'object' && !Array.isArray(score.details) ? score.details as Record<string, unknown> : {},
      createdAt: score.createdAt.toISOString(),
      updatedAt: score.updatedAt.toISOString(),
    };
  }
}

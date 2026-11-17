import { fetchSP500List, getSP500Symbols } from './sp500Service.js';
import { fetchStockQuoteYahoo, fetchStockHistoryYahoo } from './stockService.js';
import { analyzeStock, getCachedAnalysis } from './aiService.js';
import * as dbService from './dbService.js';
import * as logger from '../utils/logger.js';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export interface BulkAnalysisStatus {
  isRunning: boolean;
  total: number;
  completed: number;
  cachedCount: number;
  freshAnalyzedCount: number;
  errors: number;
  currentSymbol?: string | undefined;
  startTime?: string | undefined;
  endTime?: string | undefined;
}

const status: BulkAnalysisStatus = {
  isRunning: false,
  total: 0,
  completed: 0,
  cachedCount: 0,
  freshAnalyzedCount: 0,
  errors: 0,
};

export const getBulkAnalysisStatus = (): BulkAnalysisStatus => ({ ...status });

export interface BulkAnalysisOptions {
  modelName?: string;
  delayMs?: number;
  forceRefresh?: boolean;
}

export const runBulkAnalysis = async (options: BulkAnalysisOptions = {}) => {
  if (status.isRunning) {
    logger.warn('Bulk analysis is already in progress, skipping duplicate invocation');
    return status;
  }

  const modelName = options.modelName || process.env.DEFAULT_MODEL || 'gemini-3.1-flash-lite-preview';
  const delayMs = options.delayMs ?? 3000;
  const forceRefresh = options.forceRefresh ?? false;

  status.isRunning = true;
  status.completed = 0;
  status.cachedCount = 0;
  status.freshAnalyzedCount = 0;
  status.errors = 0;
  status.startTime = new Date().toISOString();
  status.endTime = undefined;

  logger.info('Starting bulk analysis', { modelName, forceRefresh, delayMs });

  try {
    let companies = getSP500Symbols();
    if (!companies || companies.length === 0) {
      companies = await fetchSP500List();
    }

    status.total = companies.length;
    logger.info(`Bulk analysis target: ${companies.length} companies`);

    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      if (!company) continue;

      status.currentSymbol = company.symbol;

      try {
        // Check if already cached for today
        if (!forceRefresh) {
          const cached = await getCachedAnalysis(company.symbol, modelName);
          if (cached && cached.recommendation) {
            dbService.ensureRecommendationHistory(company.symbol, cached.recommendation, modelName);
            status.cachedCount++;
            status.completed++;
            continue;
          }
        }

        // Fetch quote and history for fresh analysis
        logger.info(`[${i + 1}/${companies.length}] Analyzing ${company.symbol} (${company.name})`);
        const quote = await fetchStockQuoteYahoo(company.symbol);
        const history = await fetchStockHistoryYahoo(company.symbol);

        await analyzeStock(
          company.symbol,
          quote,
          history,
          false,
          modelName,
          forceRefresh
        );

        status.freshAnalyzedCount++;
        status.completed++;
        logger.info(`Successfully analyzed ${company.symbol}`);

        // Rate-limit delay only after making external network / AI calls
        if (i < companies.length - 1 && delayMs > 0) {
          await delay(delayMs);
        }
      } catch (err: any) {
        status.errors++;
        status.completed++;
        logger.error(`Error analyzing ${company.symbol}`, { error: err.message });
      }
    }

    status.endTime = new Date().toISOString();
    logger.info('Bulk analysis completed', {
      total: status.total,
      completed: status.completed,
      cachedCount: status.cachedCount,
      freshAnalyzedCount: status.freshAnalyzedCount,
      errors: status.errors,
    });
  } catch (err: any) {
    status.endTime = new Date().toISOString();
    logger.error('Bulk analysis failed to start or finish', { error: err.message });
  } finally {
    status.isRunning = false;
    status.currentSymbol = undefined;
  }

  return status;
};

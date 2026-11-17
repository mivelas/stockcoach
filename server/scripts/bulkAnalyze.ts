import { fetchSP500List } from '../src/services/sp500Service.js';
import { fetchStockQuoteYahoo, fetchStockHistoryYahoo } from '../src/services/stockService.js';
import { analyzeStock } from '../src/services/aiService.js';
import * as logger from '../src/utils/logger.js';
import 'dotenv/config'; // Make sure environment variables are loaded

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const runBulkAnalysis = async () => {
  logger.info('Starting bulk analysis script');
  
  try {
    const companies = await fetchSP500List();
    logger.info(`Found ${companies.length} companies. Starting analysis...`);

    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      logger.info(`[${i + 1}/${companies.length}] Analyzing ${company.symbol} (${company.name})`);

      try {
        const quote = await fetchStockQuoteYahoo(company.symbol);
        const history = await fetchStockHistoryYahoo(company.symbol);

        await analyzeStock(
          company.symbol,
          quote,
          history,
          false,
          'gemini-3.1-flash-lite-preview'
        );
        logger.info(`Successfully analyzed ${company.symbol}`);
      } catch (error: any) {
        logger.error(`Error analyzing ${company.symbol}: ${error.message}`);
      }

      if (i < companies.length - 1) {
        logger.info('Waiting 3 seconds...');
        await delay(3000);
      }
    }
    logger.info('Bulk analysis completed.');
  } catch (error: any) {
    logger.error('Bulk analysis failed', { error: error.message });
  }
};

runBulkAnalysis();

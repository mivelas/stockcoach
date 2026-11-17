import 'dotenv/config';
import { runBulkAnalysis } from '../src/services/bulkAnalysisService.js';
import * as logger from '../src/utils/logger.js';

logger.info('Invoking bulk analysis CLI script');

runBulkAnalysis()
  .then((status) => {
    logger.info('Bulk analysis CLI script finished', status);
    process.exit(0);
  })
  .catch((err) => {
    logger.error('Bulk analysis CLI script encountered error', { error: err.message });
    process.exit(1);
  });

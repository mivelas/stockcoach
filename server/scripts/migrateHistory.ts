import { readdir, readFile, stat } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { ensureRecommendationHistory } from '../src/services/dbService.js';
import * as logger from '../src/utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function migrateAnalysisFiles() {
  const analysisDir = process.env.ANALYSIS_DIR || path.resolve(__dirname, '../analysis');
  
  try {
    const files = await readdir(analysisDir);
    let processedCount = 0;
    let skippedCount = 0;

    for (const file of files) {
      if (file.endsWith('.md')) {
        const filePath = path.join(analysisDir, file);
        const fileStats = await stat(filePath);
        const fileDate = new Date(fileStats.mtime).toISOString().replace('T', ' ').substring(0, 19);

        // Extract symbol and model from `${symbol}_${model}.md`
        const baseName = file.slice(0, -3);
        const underscoreIndex = baseName.indexOf('_');
        const symbol = underscoreIndex !== -1 ? baseName.slice(0, underscoreIndex) : baseName;
        const model = underscoreIndex !== -1 ? baseName.slice(underscoreIndex + 1) : 'unknown';

        const content = await readFile(filePath, 'utf8');
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            if (parsed.recommendation) {
              const recommendation = parsed.recommendation.trim().toUpperCase();
              const inserted = ensureRecommendationHistory(symbol, recommendation, model, fileDate);
              if (inserted) {
                logger.info('Migrated recommendation to history', { symbol, recommendation, model, date: fileDate });
                processedCount++;
              } else {
                skippedCount++;
              }
            }
          } catch (e: any) {
            logger.error('Failed to parse JSON in file', { file, error: e.message });
          }
        }
      }
    }
    logger.info('Migration complete', { processedCount, skippedCount, totalFiles: files.length });
  } catch (err: any) {
    logger.error('Migration failed', { error: err.message });
  }
}

migrateAnalysisFiles();

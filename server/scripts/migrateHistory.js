import { readdir, readFile, stat } from 'fs/promises';
import path from 'path';
import { saveRecommendationHistory } from '../src/services/dbService.js';
import * as logger from '../src/utils/logger.js';
async function migrateAnalysisFiles() {
    const analysisDir = path.join(process.cwd(), 'server', 'analysis');
    try {
        const files = await readdir(analysisDir);
        const today = new Date().toISOString().split('T')[0];
        let processedCount = 0;
        for (const file of files) {
            if (file.endsWith('.md')) {
                const filePath = path.join(analysisDir, file);
                const fileStats = await stat(filePath);
                const lastModified = new Date(fileStats.mtime).toISOString().split('T')[0];
                if (lastModified === today) {
                    const symbol = file.replace('.md', '');
                    const content = await readFile(filePath, 'utf8');
                    const jsonMatch = content.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        try {
                            const parsed = JSON.parse(jsonMatch[0]);
                            if (parsed.recommendation) {
                                const recommendation = parsed.recommendation.trim().toUpperCase();
                                saveRecommendationHistory(symbol, recommendation);
                                logger.info('Migrated recommendation to history', { symbol, recommendation });
                                processedCount++;
                            }
                        }
                        catch (e) {
                            logger.error('Failed to parse JSON in file', { file });
                        }
                    }
                }
            }
        }
        logger.info('Migration complete', { processedCount });
    }
    catch (err) {
        logger.error('Migration failed', { error: err.message });
    }
}
migrateAnalysisFiles();
//# sourceMappingURL=migrateHistory.js.map
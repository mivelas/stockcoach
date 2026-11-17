import { GoogleGenAI } from '@google/genai';
import * as logger from '../utils/logger.js';
import { writeFile, mkdir, readFile, stat } from 'fs/promises';
import path from 'path';
import { saveRecommendationHistory } from './dbService.js';

const saveAnalysisToFile = async (symbol: string, text: string, modelName: string) => {
  try {
    const analysisDir = path.join(process.cwd(), 'analysis');
    await mkdir(analysisDir, { recursive: true });
    
    // Include model name in filename for model-specific caching
    const filePath = path.join(analysisDir, `${symbol}_${modelName}.md`);
    await writeFile(filePath, text, 'utf8');
    logger.info('Analysis saved to file', { symbol, modelName, filePath });
  } catch (err: any) {
    logger.error('Failed to save analysis to file', { symbol, error: err.message });
  }
};

export const getCachedAnalysis = async (symbol: string, modelName: string) => {
  const analysisDir = path.join(process.cwd(), 'analysis');
  const filePath = path.join(analysisDir, `${symbol}_${modelName}.md`);

  try {
    const fileStats = await stat(filePath);
    const lastModified = new Date(fileStats.mtime).toISOString().split('T')[0];
    const today = new Date().toISOString().split('T')[0];

    if (lastModified === today) {
      logger.info('Using cached analysis from file', { symbol, modelName });
      const cachedText = await readFile(filePath, 'utf8');
      const jsonMatch = cachedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        if (parsed.recommendation) {
          parsed.recommendation = parsed.recommendation.trim().toUpperCase();
        }
        return parsed;
      }
    }
  } catch (err) {
    // File doesn't exist or other error
  }
  return null;
};

export const analyzeStock = async (symbol: string, stockData: any, history: any, onlyCache: boolean = false, modelName: string = 'gemini-1.5-flash') => {
  const cached = await getCachedAnalysis(symbol, modelName);
  if (cached) return cached;

  if (onlyCache) {
    logger.info('Analysis not in cache, skipping (onlyCache=true)', { symbol, modelName });
    return null;
  }

  logger.info('Starting stock analysis', { symbol, modelName });
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    logger.error('GEMINI_API_KEY is not defined');
    throw new Error('GEMINI_API_KEY is not defined');
  }

  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  const prompt = `
    Act as a highly experienced, institutional-grade stock trading advisor and risk manager. Analyze the following stock data for ${symbol} and provide a recommendation (BUY, SELL, or HOLD).
    Include a concise reasoning block.

    Current Quote:
    ${JSON.stringify(stockData, null, 2)}

    Historical Data (recent):
    ${JSON.stringify(history, null, 2).slice(0, 1000)} ... (truncated)

    Format your response as a JSON object:
    {
      "recommendation": "BUY/SELL/HOLD",
      "reasoning": "...",
      "keyInsights": ["...", "..."]
    }
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
    });
    const text = response.text;
    if (!text) {
      logger.error('No text returned from Gemini API', { symbol, modelName });
      throw new Error('No text returned from Gemini API');
    }
    
    logger.info('AI analysis completed', { symbol, modelName });
    
    // Save the raw response to a markdown file
    await saveAnalysisToFile(symbol, text, modelName);

    // Clean the response in case Gemini adds markdown code blocks
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (parsed.recommendation) {
        parsed.recommendation = parsed.recommendation.trim().toUpperCase();
        saveRecommendationHistory(symbol, parsed.recommendation, modelName);
      }
      return parsed;
    }

    logger.error('Failed to parse AI response', { symbol, modelName, responseText: text });
    throw new Error('Failed to parse AI response');
  } catch (err: any) {
    logger.error('AI analysis error', { symbol, modelName, error: err.message });
    throw err;
  }
};

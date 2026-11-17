import axios from 'axios';
import * as cheerio from 'cheerio';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import * as logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const cacheFilePath = path.resolve(__dirname, '../../sp500_cache.json');

const WIKI_URL = 'https://en.wikipedia.org/wiki/List_of_S%26P_500_companies';

export interface SP500Company {
  symbol: string;
  name: string;
}

let sp500Companies: SP500Company[] = [];

export const fetchSP500List = async (): Promise<SP500Company[]> => {
  logger.info('Fetching S&P 500 list from Wikipedia');
  try {
    const { data } = await axios.get(WIKI_URL, {
      headers: {
        'User-Agent': 'StockCoach/1.0 (https://github.com/your-username/stockcoach)'
      },
      timeout: 10000
    });
    const $ = cheerio.load(data);
    const companies: SP500Company[] = [];

    $('#constituents tbody tr').each((i, row) => {
      // Skip the header row
      if (i === 0) return;

      const symbol = $(row).find('td:first-child').text().trim();
      const name = $(row).find('td:nth-child(2)').text().trim();
      
      if (symbol && name) {
        companies.push({ symbol, name });
      }
    });

    if (companies.length > 0) {
      sp500Companies = companies;
      try {
        await writeFile(cacheFilePath, JSON.stringify(companies, null, 2), 'utf8');
      } catch (writeErr: any) {
        logger.warn('Failed to save S&P 500 cache file', { error: writeErr.message });
      }
      logger.info('S&P 500 list loaded successfully', { count: sp500Companies.length });
      return sp500Companies;
    }
  } catch (error: any) {
    logger.error('Error fetching S&P 500 list from Wikipedia', { error: error.message });
    // Attempt fallback from local cache file
    try {
      const cached = await readFile(cacheFilePath, 'utf8');
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) {
        sp500Companies = parsed;
        logger.info('Loaded S&P 500 list from local cache file fallback', { count: sp500Companies.length });
        return sp500Companies;
      }
    } catch {
      // Fallback cache doesn't exist
    }
    throw error;
  }
  return sp500Companies;
};

export const getSP500Symbols = () => sp500Companies;

export const getCompanyName = (symbol: string): string | undefined => {
  return sp500Companies.find(c => c.symbol === symbol)?.name;
};

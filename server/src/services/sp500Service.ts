import axios from 'axios';
import * as cheerio from 'cheerio';
import * as logger from '../utils/logger.js';

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
      }
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

    sp500Companies = companies;
    logger.info('S&P 500 list loaded successfully', { count: sp500Companies.length });
    return sp500Companies;
  } catch (error: any) {
    logger.error('Error fetching S&P 500 list', { error: error.message });
    throw error;
  }
};

export const getSP500Symbols = () => sp500Companies;

export const getCompanyName = (symbol: string): string | undefined => {
  return sp500Companies.find(c => c.symbol === symbol)?.name;
};

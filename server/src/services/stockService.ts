import axios from 'axios';
import YahooFinance from 'yahoo-finance2';
import * as logger from '../utils/logger.js';

const yahooFinance = new YahooFinance();

const BASE_URL = 'https://www.alphavantage.co/query';

export interface StockData {
  symbol: string;
  name?: string;
  price: string;
  change: string;
  changePercent: string;
  latestTradingDay: string;
}

export interface HistoricalPoint {
  date: string;
  price: number;
}

export const fetchStockQuote = async (symbol: string): Promise<StockData> => {
  logger.info('Fetching stock quote', { symbol });
  const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
  
  if (!ALPHA_VANTAGE_API_KEY || ALPHA_VANTAGE_API_KEY === 'your_alpha_vantage_key') {
    logger.error('ALPHA_VANTAGE_API_KEY not configured');
    throw new Error('ALPHA_VANTAGE_API_KEY is not configured in server/.env');
  }

  try {
    const response = await axios.get(BASE_URL, {
      params: {
        function: 'GLOBAL_QUOTE',
        symbol,
        apikey: ALPHA_VANTAGE_API_KEY,
      },
    });

    const quote = response.data['Global Quote'];
    
    if (!quote || Object.keys(quote).length === 0) {
      logger.warn('Stock quote not found or API limit reached', { symbol });
      throw new Error('Invalid symbol or API limit reached');
    }

    logger.info('Stock quote fetched successfully', { symbol });
    return {
      symbol: quote['01. symbol'],
      price: quote['05. price'],
      change: quote['09. change'],
      changePercent: quote['10. change percent'],
      latestTradingDay: quote['07. latest trading day'],
    };
  } catch (err: any) {
    logger.error('Error in fetchStockQuote', { symbol, error: err.message });
    throw err;
  }
};

export const fetchStockHistory = async (symbol: string): Promise<HistoricalPoint[]> => {
  logger.info('Fetching stock history', { symbol });
  const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
  
  try {
    const response = await axios.get(BASE_URL, {
      params: {
        function: 'TIME_SERIES_DAILY',
        symbol,
        apikey: ALPHA_VANTAGE_API_KEY,
      },
    });

    const timeSeries = response.data['Time Series (Daily)'];
    if (!timeSeries) {
      logger.warn('Stock history not found', { symbol });
      return [];
    }

    logger.info('Stock history fetched successfully', { symbol, points: Object.keys(timeSeries).length });
    // Transform and limit to last 30 days for the chart
    return Object.entries(timeSeries)
      .map(([date, values]: [string, any]) => ({
        date,
        price: parseFloat(values['4. close']),
      }))
      .reverse()
      .slice(-30);
  } catch (err: any) {
    logger.error('Error in fetchStockHistory', { symbol, error: err.message });
    throw err;
  }
};

export const fetchStockQuoteYahoo = async (symbol: string): Promise<StockData> => {
  logger.info('Fetching stock quote from Yahoo Finance', { symbol });
  try {
    const quote = await yahooFinance.quote(symbol);
    
    if (!quote) {
      logger.warn('Yahoo stock quote not found', { symbol });
      throw new Error('Symbol not found on Yahoo Finance');
    }

    logger.info('Yahoo stock quote fetched successfully', { symbol });
    return {
      symbol: quote.symbol,
      price: (quote.regularMarketPrice || 0).toString(),
      change: (quote.regularMarketChange || 0).toString(),
      changePercent: (quote.regularMarketChangePercent || 0).toString() + '%',
      latestTradingDay: new Date(quote.regularMarketTime || Date.now()).toISOString().split('T')[0]!,
    };
  } catch (err: any) {
    logger.error('Error in fetchStockQuoteYahoo', { symbol, error: err.message });
    throw err;
  }
};

export const fetchStockHistoryYahoo = async (symbol: string): Promise<HistoricalPoint[]> => {
  logger.info('Fetching stock history from Yahoo Finance', { symbol });
  try {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 45); // Get extra days to ensure we have 30 trading days

    const result = await yahooFinance.chart(symbol, {
      period1: startDate,
      period2: endDate,
      interval: '1d',
    });

    const quotes = result.quotes || [];
    
    logger.info('Yahoo stock history fetched successfully', { symbol, points: quotes.length });

    return quotes
      .filter(q => q.date && q.close !== undefined)
      .map(q => ({
        date: new Date(q.date).toISOString().split('T')[0]!,
        price: q.close as number,
      }))
      .slice(-30);
  } catch (err: any) {
    logger.error('Error in fetchStockHistoryYahoo', { symbol, error: err.message });
    throw err;
  }
};

export const fetchStockPricesYahoo = async (symbols: string[]): Promise<any[]> => {
  logger.info('Fetching bulk quotes from Yahoo Finance', { count: symbols.length });
  
  try {
    // yahoo-finance2 supports bulk quotes by passing an array
    const quotes = await yahooFinance.quote(symbols);
    
    return quotes.map(quote => ({
      symbol: quote.symbol,
      price: quote.regularMarketPrice,
      change: (quote.regularMarketChange || 0).toFixed(2),
      changePercent: (quote.regularMarketChangePercent || 0).toFixed(2) + '%',
    }));
  } catch (err: any) {
    logger.error('Error in bulk fetchStockPricesYahoo', { error: err.message });
    // Fallback to individual fetching if bulk fails
    const results = await Promise.allSettled(
      symbols.map(async (symbol) => {
        const quote = await yahooFinance.quote(symbol);
        return {
          symbol: quote.symbol,
          price: quote.regularMarketPrice,
          change: (quote.regularMarketChange || 0).toFixed(2),
          changePercent: (quote.regularMarketChangePercent || 0).toFixed(2) + '%',
        };
      })
    );
    
    return results
      .filter((r): r is PromiseFulfilledResult<any> => r.status === 'fulfilled')
      .map(r => r.value);
  }
};

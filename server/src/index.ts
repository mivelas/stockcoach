import 'dotenv/config';
import express from 'express';
import cors from 'cors';

import { 
  fetchStockQuote, 
  fetchStockHistory, 
  fetchStockQuoteYahoo, 
  fetchStockHistoryYahoo,
  fetchStockPricesYahoo
} from './services/stockService.js';
import { analyzeStock, getCachedAnalysis } from './services/aiService.js';
import { fetchSP500List, getSP500Symbols, getCompanyName } from './services/sp500Service.js';
import * as dbService from './services/dbService.js';
import * as logger from './utils/logger.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Splunk-friendly request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Inbound request', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
  });
  next();
});

// Favorites Endpoints
app.get('/api/favorites', (req, res) => {
  res.json(dbService.getFavorites());
});

app.post('/api/favorites', (req, res) => {
  const { symbol } = req.body;
  if (!symbol) return res.status(400).json({ error: 'Symbol required' });
  dbService.addFavorite(symbol);
  res.json({ success: true });
});

app.delete('/api/favorites/:symbol', (req, res) => {
  const { symbol } = req.params;
  dbService.removeFavorite(symbol);
  res.json({ success: true });
});

// Portfolio Endpoints
app.get('/api/portfolio', (req, res) => {
  try {
    res.json(dbService.getPortfolio());
  } catch (err: any) {
    logger.error('Error fetching portfolio', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/portfolio', (req, res) => {
  const { symbol, quantity, purchase_price } = req.body;
  if (!symbol || !quantity || !purchase_price) {
    return res.status(400).json({ error: 'Missing portfolio data' });
  }
  try {
    const id = dbService.addHolding(symbol, quantity, purchase_price);
    res.json({ success: true, id });
  } catch (err: any) {
    logger.error('Error adding to portfolio', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/portfolio/:id', (req, res) => {
  const { id } = req.params;
  try {
    dbService.removeHolding(Number(id));
    res.json({ success: true });
  } catch (err: any) {
    logger.error('Error removing from portfolio', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/sp500', (req, res) => {
  logger.info('API call: getSP500Symbols');
  res.json(getSP500Symbols());
});

app.get('/api/stock/:symbol', async (req, res) => {
  const { symbol } = req.params;
  logger.info('API call: fetchStockQuote', { symbol });
  try {
    const data = await fetchStockQuoteYahoo(symbol);
    const history = await fetchStockHistoryYahoo(symbol);
    
    // Enrich with name if available
    const name = getCompanyName(symbol);
    if (name) data.name = name;
    
    res.json({ ...data, history });
  } catch (err: any) {
    logger.error('Error fetching stock data', { symbol, error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stock/:symbol/history', (req, res) => {
  const { symbol } = req.params;
  logger.info('API call: getRecommendationHistory', { symbol });
  try {
    const history = dbService.getRecommendationHistory(symbol);
    logger.info('Fetched recommendation history', { symbol, count: history.length });
    res.json(history);
  } catch (err: any) {
    logger.error('Error fetching recommendation history', { symbol, error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/stock/:symbol/analyze', async (req, res) => {
  const { symbol } = req.params;
  const { model } = req.query;
  logger.info('API call: analyzeStock', { symbol, model });
  try {
    const data = await fetchStockQuote(symbol);
    const history = await fetchStockHistory(symbol);
    
    // Enrich with name if available
    const name = getCompanyName(symbol);
    if (name) data.name = name;
    
    const analysis = await analyzeStock(symbol, data, history, false, model as string);
    res.json({ ...data, analysis });
  } catch (err: any) {
    logger.error('Error analyzing stock', { symbol, error: err.message });
    res.status(500).json({ error: err.message });
  }
});

// Yahoo Finance Endpoints
app.get('/api/yahoo/stock/:symbol', async (req, res) => {
  const { symbol } = req.params;
  logger.info('API call: fetchStockQuoteYahoo', { symbol });
  try {
    const data = await fetchStockQuoteYahoo(symbol);
    const history = await fetchStockHistoryYahoo(symbol);
    
    const name = getCompanyName(symbol);
    if (name) data.name = name;
    
    res.json({ ...data, history });
  } catch (err: any) {
    logger.error('Error fetching stock data from Yahoo', { symbol, error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/yahoo/stock/:symbol/analyze', async (req, res) => {
  const { symbol } = req.params;
  const { model } = req.query;
  logger.info('API call: analyzeStockYahoo', { symbol, model });
  try {
    const data = await fetchStockQuoteYahoo(symbol);
    const history = await fetchStockHistoryYahoo(symbol);
    
    const name = getCompanyName(symbol);
    if (name) data.name = name;
    
    const analysis = await analyzeStock(symbol, data, history, false, model as string);
    res.json({ ...data, analysis });
  } catch (err: any) {
    logger.error('Error analyzing stock from Yahoo', { symbol, error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/yahoo/analyze-bulk', async (req, res) => {
  const { symbols: allSymbols, model } = req.body;
  const modelName = model || 'gemini-1.5-flash';
  logger.info('API call: analyzeStockBulk initial call (Cache-only check)', { symbolCount: allSymbols?.length, model: modelName });
  
  if (!allSymbols || !Array.isArray(allSymbols)) {
    return res.status(400).json({ error: 'Invalid symbols array' });
  }

  try {
    const results: Record<string, any> = {};
    const BATCH_SIZE = 50; // Larger batch size since it's just local file IO

    for (let i = 0; i < allSymbols.length; i += BATCH_SIZE) {
      const batch = allSymbols.slice(i, i + BATCH_SIZE);
      
      await Promise.all(batch.map(async (symbol) => {
        const cached = await getCachedAnalysis(symbol, modelName);
        if (cached) {
          results[symbol] = cached.recommendation;
        }
      }));
    }

    res.json(results);
  } catch (err: any) {
    logger.error('Error in bulk cache check', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/yahoo/prices', async (req, res) => {
  const { symbols } = req.body;
  logger.info('API call: fetchStockPricesYahoo', { symbolCount: symbols?.length });
  if (!symbols || !Array.isArray(symbols)) {
    return res.status(400).json({ error: 'Invalid symbols array' });
  }
  try {
    const prices = await fetchStockPricesYahoo(symbols);
    res.json(prices);
  } catch (err: any) {
    logger.error('Error fetching bulk prices from Yahoo', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/report', async (req, res) => {
  const { model } = req.query;
  const modelName = (model as string) || 'gemini-3.1-flash-lite-preview';
  logger.info('API call: getReport', { model: modelName });

  try {
    const companies = getSP500Symbols();
    const symbols = companies.map(c => c.symbol);
    
    // Fetch prices in bulk
    const prices = await fetchStockPricesYahoo(symbols);
    
    const reportData: any[] = [];
    const BATCH_SIZE = 50;

    for (let i = 0; i < symbols.length; i += BATCH_SIZE) {
      const batch = symbols.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map(async (symbol) => {
        const cached = await getCachedAnalysis(symbol, modelName);
        if (cached) {
          const priceData = prices.find(p => p.symbol === symbol);
          reportData.push({
            symbol,
            name: getCompanyName(symbol),
            price: priceData?.price,
            change: priceData?.change,
            changePercent: priceData?.changePercent,
            ...cached
          });
        }
      }));
    }

    res.json(reportData);
  } catch (err: any) {
    logger.error('Error generating report', { error: err.message });
    res.status(500).json({ error: err.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    env: {
      ALPHA_VANTAGE_API_KEY: !!process.env.ALPHA_VANTAGE_API_KEY,
      GEMINI_API_KEY: !!process.env.GEMINI_API_KEY
    }
  });
});

// Load S&P 500 list on startup
fetchSP500List()
  .then(() => logger.info('S&P 500 list loaded successfully'))
  .catch(err => logger.error('Failed to load S&P 500 list on startup', { error: err.message }));

app.listen(Number(PORT), '0.0.0.0', () => {
  logger.info(`Server started on port ${PORT}`);
});

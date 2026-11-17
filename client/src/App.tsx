import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, TrendingUp, TrendingDown, BrainCircuit, Loader2, Star, StarOff, BookOpen, Trash2, FileText } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Link } from 'react-router-dom';
import './App.css';

interface StockAnalysis {
  recommendation: 'BUY' | 'SELL' | 'HOLD';
  reasoning: string;
  keyInsights: string[];
}

interface HistoricalPoint {
  date: string;
  price: number;
}

interface RecommendationHistory {
  recommendation: string;
  model: string;
  created_at: string;
}

interface PortfolioHolding {
  id: number;
  symbol: string;
  quantity: number;
  purchase_price: number;
  purchase_date: string;
}

interface SP500Company {
  symbol: string;
  name: string;
  price?: number;
  recommendation?: 'BUY' | 'SELL' | 'HOLD';
}

interface StockData {
  symbol: string;
  name?: string;
  price: string;
  change: string;
  changePercent: string;
  latestTradingDay: string;
  history?: HistoricalPoint[];
  analysis?: StockAnalysis;
}

const API_BASE_URL = 'http://localhost:3001/api';

function App() {
  const [ticker, setTicker] = useState('');
  const [stockData, setStockData] = useState<StockData | null>(null);
  const [recommendationHistory, setRecommendationHistory] = useState<RecommendationHistory[]>([]);
  const [portfolio, setPortfolio] = useState<PortfolioHolding[]>([]);
  const [holdingQuantity, setHoldingQuantity] = useState('');
  const [holdingPrice, setHoldingPrice] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sp500Companies, setSp500Companies] = useState<SP500Company[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [favoriteData, setFavoriteData] = useState<SP500Company[]>([]);
  const [showHistoryTable, setShowHistoryTable] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedModel, setSelectedModel] = useState('gemini-3.1-flash-lite-preview');
  const [filter, setFilter] = useState<'ALL' | 'BUY' | 'HOLD' | 'SELL'>('ALL');

  const fetchFavorites = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/favorites`);
      setFavorites(res.data);
    } catch (err) {
      console.error('Failed to fetch favorites', err);
    }
  };

  const fetchPortfolio = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/portfolio`);
      setPortfolio(res.data);
    } catch (err) {
      console.error('Failed to fetch portfolio', err);
    }
  };

  useEffect(() => {
    fetchFavorites();
    fetchPortfolio();
    axios.get(`${API_BASE_URL}/sp500`)
      .then(async (res) => {
        const companies = res.data;
        setSp500Companies(companies);
        
        const symbols = companies.map((c: SP500Company) => c.symbol);
        
        // Analysis
        setAnalyzing(true);
        try {
          console.log('Starting bulk analysis for first 50 S&P 500 companies');
          const analysisRes = await axios.post(`${API_BASE_URL}/yahoo/analyze-bulk`, { 
            symbols: symbols,
            model: selectedModel 
          });
          const recommendations = analysisRes.data;
          
          setSp500Companies(prev => prev.map(c => ({
            ...c,
            recommendation: recommendations[c.symbol]
          })));
        } catch (err) {
          console.error('Failed to load analysis', err);
        } finally {
          setAnalyzing(false);
        }
      })
      .catch(err => console.error('Failed to load S&P 500 list', err));
  }, []);

  useEffect(() => {
    if (favorites.length > 0 && sp500Companies.length > 0) {
      const favs = favorites.map(symbol => {
        const company = sp500Companies.find(c => c.symbol === symbol);
        return company || { symbol, name: symbol };
      });
      setFavoriteData(favs);
    } else {
      setFavoriteData([]);
    }
  }, [favorites, sp500Companies]);

  const toggleFavorite = async (symbol: string) => {
    try {
      if (favorites.includes(symbol)) {
        await axios.delete(`${API_BASE_URL}/favorites/${symbol}`);
      } else {
        await axios.post(`${API_BASE_URL}/favorites`, { symbol });
      }
      fetchFavorites();
    } catch (err) {
      console.error('Failed to toggle favorite', err);
    }
  };

  const fetchRecommendationHistory = async (symbol: string) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/stock/${symbol}/history`);
      setRecommendationHistory(res.data);
    } catch (err) {
      console.error('Failed to fetch recommendation history', err);
    }
  };

  const addToPortfolio = async () => {
    if (!stockData || !holdingQuantity || !holdingPrice) return;
    try {
      await axios.post(`${API_BASE_URL}/portfolio`, {
        symbol: stockData.symbol,
        quantity: parseFloat(holdingQuantity),
        purchase_price: parseFloat(holdingPrice)
      });
      setHoldingQuantity('');
      setHoldingPrice('');
      fetchPortfolio();
    } catch (err) {
      console.error('Failed to add to portfolio', err);
    }
  };

  const removeFromPortfolio = async (id: number) => {
    try {
      await axios.delete(`${API_BASE_URL}/portfolio/${id}`);
      fetchPortfolio();
    } catch (err) {
      console.error('Failed to remove from portfolio', err);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticker) return;

    setLoading(true);
    setError('');
    setStockData(null);
    setShowHistoryTable(false);
    setRecommendationHistory([]);

    try {
      const response = await axios.get(`${API_BASE_URL}/stock/${ticker.toUpperCase()}`);
      setStockData(response.data);
      fetchRecommendationHistory(ticker.toUpperCase());
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch stock data');
    } finally {
      setLoading(false);
    }
  };

  const handleSymbolClick = async (symbol: string) => {
    setTicker(symbol);
    setLoading(true);
    setError('');
    setStockData(null);
    setShowHistoryTable(false);
    setRecommendationHistory([]);

    try {
      const response = await axios.get(`${API_BASE_URL}/stock/${symbol}`);
      setStockData(response.data);
      fetchRecommendationHistory(symbol);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch stock data');
    } finally {
      setLoading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!stockData) return;

    setLoading(true);
    setError('');

    try {
      const response = await axios.get(`${API_BASE_URL}/yahoo/stock/${stockData.symbol}/analyze?model=${selectedModel}`);
      setStockData(response.data);
      fetchRecommendationHistory(stockData.symbol);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const isPositive = stockData && parseFloat(stockData.change) >= 0;

  return (
    <div className="container">
      <header className="header">
        <div className="header-top" style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
          <div className="model-selector">
            <label>AI Model:</label>
            <select 
              value={selectedModel} 
              onChange={(e) => setSelectedModel(e.target.value)}
              className="glass-select"
            >
              <option value="gemini-3-flash-preview">Gemini 3 Flash Preview</option>
              <option value="gemini-3.1-flash-lite-preview">Gemini 3.1 Flash Lite Preview</option>
              <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
              <option value="gemini-2.5-flash-lite">Gemini 2.5 Flash Lite</option>
              <option value="gemma-4-31b-it">Gemma 4 31B IT</option>
              <option value="gemma-4-26b-a4b-it">Gemma 4 26B A4B IT</option>
            </select>
          </div>
          <div className="header-links" style={{ display: 'flex', gap: '1rem' }}>
            <Link to="/report" className="secondary-btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={16} /> Market Report
            </Link>
            <Link to="/guide" className="secondary-btn" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <BookOpen size={16} /> App Guide
            </Link>
          </div>
        </div>
        <h1>
          <img src="/logo.svg" alt="StockCoach Logo" style={{ width: '3rem', height: '3rem', verticalAlign: 'middle', marginRight: '1rem' }} />
          StockCoach
        </h1>
        <p>Intelligent AI-powered stock analysis</p>
      </header>

      <form className="glass-panel search-box" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Enter stock ticker (e.g., AAPL, TSLA)"
          value={ticker}
          onChange={(e) => setTicker(e.target.value)}
          list="sp500-list"
        />
        <datalist id="sp500-list">
          {sp500Companies.map((company) => (
            <option key={company.symbol} value={company.symbol}>{company.name}</option>
          ))}
        </datalist>
        <button type="submit" disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : <Search size={20} />}
          Search
        </button>
      </form>

      {error && (
        <div className="glass-panel" style={{ color: 'var(--error)', marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {loading && !stockData && (
        <div className="loading">
          <Loader2 className="animate-spin" size={48} style={{ marginBottom: '1rem' }} />
          <p>Fetching market data...</p>
        </div>
      )}

      {stockData && (
        <div className="glass-panel stock-card">
          <div className="quote-info">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2>{stockData.name || stockData.symbol}</h2>
                {stockData.name && <div style={{ color: 'var(--text-dim)', marginTop: '-0.5rem', marginBottom: '1rem', fontWeight: 600 }}>{stockData.symbol}</div>}
              </div>
              <button 
                className="icon-btn" 
                onClick={() => toggleFavorite(stockData.symbol)}
                title={favorites.includes(stockData.symbol) ? "Remove from favorites" : "Add to favorites"}
              >
                {favorites.includes(stockData.symbol) ? <Star size={24} fill="var(--warning)" color="var(--warning)" /> : <StarOff size={24} />}
              </button>
            </div>
            <div className="price">${parseFloat(stockData.price).toFixed(2)}</div>
            <div className={`change ${isPositive ? 'up' : 'down'}`}>
              {isPositive ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
              {stockData.change} ({stockData.changePercent})
            </div>
            <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem' }}>
              As of {stockData.latestTradingDay}
            </p>
            
            {!stockData.analysis && (
              <button 
                onClick={handleAnalyze} 
                style={{ marginTop: '1.5rem', width: '100%', justifyContent: 'center' }}
                disabled={loading}
              >
                {loading ? <Loader2 className="animate-spin" /> : <BrainCircuit size={20} />}
                Analyze with {selectedModel.includes('pro') ? 'Gemini Pro' : 'Gemini Flash'}
              </button>
            )}
          </div>

          {stockData.history && stockData.history.length > 0 && (
            <div className="chart-container">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ margin: 0 }}>{stockData.name || stockData.symbol} - Price History (30 Days)</h3>
                <button 
                  className="secondary-btn"
                  onClick={() => setShowHistoryTable(!showHistoryTable)}
                  style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                >
                  {showHistoryTable ? 'Hide Table' : 'Show History Table'}
                </button>
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={stockData.history}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="var(--text-dim)" 
                    fontSize={12} 
                    tickFormatter={(str) => str.split('-').slice(1).join('/')}
                  />
                  <YAxis 
                    stroke="var(--text-dim)" 
                    fontSize={12} 
                    domain={['auto', 'auto']}
                    tickFormatter={(val) => `$${val}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--glass-bg)', 
                      borderColor: 'var(--glass-border)',
                      borderRadius: '0.5rem',
                      color: 'white'
                    }}
                    itemStyle={{ color: 'var(--accent-color)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    stroke="var(--accent-color)" 
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, strokeWidth: 0 }}
                  />
                </LineChart>
              </ResponsiveContainer>

              {showHistoryTable && (
                <div className="history-table-container">
                  <table>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stockData.history.slice().reverse().map((point, index) => (
                        <tr key={index}>
                          <td>{point.date}</td>
                          <td>${point.price.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {stockData.analysis && (
            <div className="analysis-section">
              <div className={`recommendation-badge ${stockData.analysis.recommendation.trim().toLowerCase()}`}>
                {stockData.analysis.recommendation}
              </div>
              <div className="reasoning">
                <strong>Reasoning:</strong>
                <p>{stockData.analysis.reasoning}</p>
              </div>
              <div className="insights">
                <strong>Key Insights:</strong>
                <ul>
                  {stockData.analysis.keyInsights.map((insight, i) => (
                    <li key={i}>{insight}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          
          <div className="glass-panel" style={{ marginTop: '2rem' }}>
            <h3>Add to Portfolio</h3>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              <input type="number" placeholder="Quantity" value={holdingQuantity} onChange={(e) => setHoldingQuantity(e.target.value)} />
              <input type="number" placeholder="Price" value={holdingPrice} onChange={(e) => setHoldingPrice(e.target.value)} />
              <button onClick={addToPortfolio}>Add</button>
            </div>
          </div>
        </div>
      )}

      {recommendationHistory.length > 0 && (
         <div className="glass-panel" style={{ marginTop: '2rem', paddingTop: '1rem' }}>
           <h3>Recommendation History</h3>
           <div className="history-table-container">
             <table>
               <thead>
                 <tr>
                   <th>Date</th>
                   <th>Recommendation</th>
                   <th>Model</th>
                 </tr>
               </thead>
               <tbody>
                 {recommendationHistory.map((item, index) => (
                   <tr key={index}>
                     <td>{item.created_at.split(' ')[0]}</td>
                     <td className={item.recommendation.toLowerCase()}>{item.recommendation}</td>
                     <td style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{item.model}</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
         </div>
      )}

      {portfolio.length > 0 && (
         <div className="glass-panel" style={{ marginTop: '2rem' }}>
           <h3>Portfolio</h3>
           <table style={{ width: '100%', borderCollapse: 'collapse' }}>
             <thead>
               <tr style={{ textAlign: 'left' }}>
                 <th>Symbol</th>
                 <th>Qty</th>
                 <th>Purchase Price</th>
                 <th>P&L</th>
                 <th>Action</th>
               </tr>
             </thead>
             <tbody>
               {portfolio.map(h => {
                 const currentPrice = parseFloat(stockData?.price || '0');
                 const pnl = (currentPrice - h.purchase_price) * h.quantity;
                 return (
                   <tr key={h.id}>
                     <td>{h.symbol}</td>
                     <td>{h.quantity}</td>
                     <td>${h.purchase_price.toFixed(2)}</td>
                     <td style={{ color: pnl >= 0 ? 'var(--success)' : 'var(--error)' }}>
                       ${pnl.toFixed(2)}
                     </td>
                     <td><button className="icon-btn" onClick={() => removeFromPortfolio(h.id)}><Trash2 size={16} /></button></td>
                   </tr>
                 );
               })}
             </tbody>
           </table>
         </div>
      )}

      {favoriteData.length > 0 && (
        <div className="glass-panel sp500-section favorites-section" style={{ borderTop: '2px solid var(--warning)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
            <h3 style={{ margin: 0, color: 'var(--warning)' }}>Favorite Stocks</h3>
            <Star size={20} fill="var(--warning)" color="var(--warning)" />
          </div>
          <div className="symbol-grid">
            {favoriteData.map((company) => (
              <div 
                key={company.symbol} 
                className={`symbol-item ${company.recommendation ? company.recommendation.trim().toLowerCase() : ''}`}
                onClick={() => handleSymbolClick(company.symbol)}
                title={company.name}
              >
                <div className="item-header">
                  <div className="item-symbol">{company.symbol}</div>
                  {company.price !== undefined && (
                    <div className="item-price">${company.price.toFixed(2)}</div>
                  )}
                </div>
                <div className="item-name">{company.name}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {sp500Companies.length > 0 && (
        <div className="glass-panel sp500-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <h3 style={{ margin: 0 }}>S&P 500 Companies</h3>
              {analyzing && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-color)', fontSize: '0.875rem' }}>
                  <Loader2 className="animate-spin" size={16} />
                  <span>AI analyzing...</span>
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              {(['ALL', 'BUY', 'HOLD', 'SELL'] as const).map(f => (
                <button 
                  key={f} 
                  className={`secondary-btn ${filter === f ? 'active' : ''}`}
                  onClick={() => setFilter(f)}
                  style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
          <div className="symbol-grid">
            {sp500Companies
              .filter(c => filter === 'ALL' || c.recommendation === filter)
              .map((company) => (
                <div 
                  key={company.symbol} 
                  className={`symbol-item ${company.recommendation ? company.recommendation.trim().toLowerCase() : ''}`}
                  onClick={() => handleSymbolClick(company.symbol)}
                  title={company.name}
                >
                  <div className="item-header">
                    <div className="item-symbol">{company.symbol}</div>
                    {company.price !== undefined && (
                      <div className="item-price">${company.price.toFixed(2)}</div>
                    )}
                  </div>
                  <div className="item-name">{company.name}</div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default App;

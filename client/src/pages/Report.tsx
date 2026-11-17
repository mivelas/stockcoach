import { useState, useEffect } from 'react';
import axios from 'axios';
import { Loader2, ArrowLeft, Printer } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Report.css';

interface StockReportItem {
  symbol: string;
  name: string;
  price: number;
  change: string;
  changePercent: string;
  recommendation: 'BUY' | 'SELL' | 'HOLD';
  reasoning: string;
  keyInsights: string[];
}

const API_BASE_URL = 'http://localhost:3001/api';

const Report = () => {
  const [reportData, setReportData] = useState<StockReportItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-3.1-flash-lite-preview');

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/report?model=${selectedModel}`);
      setReportData(res.data);
    } catch (err) {
      console.error('Failed to fetch report', err);
      setError('Failed to load report data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, [selectedModel]);

  const groupedData = {
    BUY: reportData.filter(item => item.recommendation === 'BUY'),
    HOLD: reportData.filter(item => item.recommendation === 'HOLD'),
    SELL: reportData.filter(item => item.recommendation === 'SELL'),
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="report-loading">
        <Loader2 className="animate-spin" size={48} />
        <p>Generating Institutional Report...</p>
      </div>
    );
  }

  return (
    <div className="report-container">
      <header className="report-header no-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Link to="/" className="secondary-btn">
            <ArrowLeft size={16} /> Back to Dashboard
          </Link>
          <h1>StockCoach Market Report</h1>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <select 
            value={selectedModel} 
            onChange={(e) => setSelectedModel(e.target.value)}
            className="glass-select"
          >
            <option value="gemini-3.1-flash-lite-preview">Gemini 3.1 Flash Lite</option>
            <option value="gemini-3-flash-preview">Gemini 3 Flash</option>
            <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
            <option value="gemma-4-26b-a4b-it">Gemma 4 26B</option>
          </select>
          <button onClick={handlePrint} className="primary-btn">
            <Printer size={16} /> Print to PDF
          </button>
        </div>
      </header>

      <div className="print-header">
        <h1>StockCoach Institutional Market Analysis</h1>
        <div className="print-meta">
          <span>Date: {new Date().toLocaleDateString()}</span>
          <span>Model: {selectedModel}</span>
        </div>
      </div>

      {error && <div className="error-message">{error}</div>}

      <section className="report-summary">
        <h2>Executive Summary</h2>
        <div className="summary-grid">
          <div className="summary-card buy">
            <h3>BUY</h3>
            <div className="count">{groupedData.BUY.length}</div>
          </div>
          <div className="summary-card hold">
            <h3>HOLD</h3>
            <div className="count">{groupedData.HOLD.length}</div>
          </div>
          <div className="summary-card sell">
            <h3>SELL</h3>
            <div className="count">{groupedData.SELL.length}</div>
          </div>
        </div>
      </section>

      {(['BUY', 'HOLD', 'SELL'] as const).map(rec => (
        <section key={rec} className={`report-section ${rec.toLowerCase()}`}>
          <h2 className="section-title">{rec} Recommendations</h2>
          {groupedData[rec].length === 0 ? (
            <p className="no-data">No {rec} recommendations for this period.</p>
          ) : (
            <table className="report-table">
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Company Name</th>
                  <th>Price</th>
                  <th>Change</th>
                  <th>Reasoning & Insights</th>
                </tr>
              </thead>
              <tbody>
                {groupedData[rec].map(item => (
                  <tr key={item.symbol}>
                    <td className="symbol-cell"><strong>{item.symbol}</strong></td>
                    <td className="name-cell">{item.name}</td>
                    <td className="price-cell">${item.price?.toFixed(2)}</td>
                    <td className={`change-cell ${parseFloat(item.change) >= 0 ? 'up' : 'down'}`}>
                      {item.change} ({item.changePercent})
                    </td>
                    <td className="analysis-cell">
                      <div className="reasoning">{item.reasoning}</div>
                      <ul className="insights-list">
                        {item.keyInsights.slice(0, 3).map((insight, i) => (
                          <li key={i}>{insight}</li>
                        ))}
                      </ul>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      ))}

      <footer className="print-footer">
        <p>Generated by StockCoach AI Investment Assistant. For informational purposes only.</p>
      </footer>
    </div>
  );
};

export default Report;

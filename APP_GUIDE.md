# StockCoach: Features & Functionality

StockCoach is a professional-grade, AI-powered investment assistant designed to bridge the gap between complex financial data and actionable trading insights. Optimized for high-resolution, ultra-wide monitors, it provides a comprehensive dashboard for market analysis.

## Core Features

### 1. Real-Time Market Overview
- **S&P 500 Symbol Grid**: A massive, high-visibility dashboard showing the current price and status of major S&P 500 companies.
- **Dynamic Pricing**: Fetches individual stock prices directly from Yahoo Finance.
- **Visual Status**: Stocks are color-coded based on their latest AI-generated recommendation:
  - **Green (BUY)**: Strong positive outlook based on technical and historical data.
  - **Yellow (HOLD)**: Neutral outlook, suggesting caution or maintenance.
  - **Red (SELL)**: Negative outlook, highlighting potential risks or downward trends.

### 2. Deep Stock Analysis
- **Detailed Quote**: View current price, daily change, and percentage movement.
- **Interactive Charts**: 30-day historical price movement visualized through a responsive line chart.
- **Historical Data Table**: Accessible toggle to view raw daily closing prices for the past month.

### 3. AI-Powered Insights (Gemini AI)
- **Institutional-Grade Reasoning**: Uses Gemini 1.5 Flash to analyze price trends and market context.
- **Actionable Recommendations**: Provides a clear BUY/SELL/HOLD signal.
- **Reasoning & Key Insights**: Delivers a structured explanation of "why" a recommendation was made, including specific market factors and technical observations.

### 4. Portfolio Tracking (Favorites)
- **Personalized Dashboard**: Save your most-watched stocks to a dedicated "Favorite Stocks" section at the top of your dashboard.
- **Persistence**: Favorites are stored in a local SQLite database (`stockcoach.db`), ensuring your list is preserved even after restarting the server.
- **Easy Toggling**: Use the star icon on any stock's detail page to instantly add or remove it from your favorites.

### 5. Flexible AI Model Selection
- **Model Choice**: Choose between different Gemini versions directly from the dashboard:
  - **Gemini 1.5 Flash**: Optimized for speed and cost-efficiency.
  - **Gemini 1.5 Pro**: Best for complex financial reasoning and deep analysis.
  - **Gemini 2.0 Flash (Experimental)**: Access the latest cutting-edge AI features.
- **Custom Analysis**: The selected model is used for all live analyses triggered by the "Analyze with Gemini" button.

### 6. Automated Bulk Analysis (CLI)
- **Batch Processing**: Use the `server/scripts/bulkAnalyze.ts` script to run AI analysis on all S&P 500 stocks in one go.
- **Rate-Limited**: The script automatically introduces a 10-second delay between API requests to respect external provider limits.
- **Persistent Reports**: All generated analysis reports are saved as Markdown files in `server/analysis/`, making them available for immediate display in the dashboard upon subsequent UI loads.

### 7. Advanced Performance & Efficiency
- **Daily Analysis Caching**: Analysis results are saved to `.md` files in the `server/analysis/` directory. If a stock is analyzed, that result is reused for the rest of the day to save API tokens.
- **Cache-Only Startup**: On application launch, the dashboard only displays recommendations that are already cached. It will *never* consume tokens automatically on startup.
- **Parallel Processing**: Bulk price fetching and cached analysis retrieval are performed in parallel batches for near-instant loading.

### 8. Ultra-Wide Optimization
- **Dashboard Layout**: The UI expands to 95% of screen width, maximizing the information visible at once.
- **High-DPI Support**: Large typography and spacious cards ensure readability on 4K and ultra-wide displays.

## Technical Architecture

- **Frontend**: React 18, Vite, TypeScript, Recharts (Visualization), Lucide-React (Icons).
- **Backend**: Node.js, Express, TypeScript (ESM), Yahoo Finance API (`yahoo-finance2`), Cheerio (Wikipedia Scraping).
- **Database**: SQLite (`better-sqlite3`) for portfolio persistence.
- **AI Integration**: Google Generative AI SDK (Multi-model support).
- **Persistence**: File-system based caching with markdown storage for auditability.

## User Workflow

1. **Launch**: Open StockCoach. The dashboard populates with current prices and any cached analysis from today.
2. **Select Model**: Choose your preferred Gemini model from the dropdown at the top right.
3. **Explore**: Scroll through the maximized grid or use the search bar to find specific tickers.
4. **Favorite**: Click a stock and use the star icon to add it to your "Favorite Stocks" for quick access.
5. **Analyze**: Click "Analyze with Gemini" to trigger a fresh analysis using your selected model. The result is saved to the local cache.

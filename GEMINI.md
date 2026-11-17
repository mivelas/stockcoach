# GEMINI.md

This file provides instructions and context for Gemini AI interactions within the StockCoach project.

## Project Overview

StockCoach is an AI-powered investment assistant that analyzes historical stock data to provide institutional-grade buy/sell recommendations.

- **Purpose**: Bridge the gap between raw financial data and actionable insights using Google's most advanced Gemini models.
- **Key Technologies**: 
    - **AI**: Google Gemini AI (Multi-model support: 1.5 Flash/Pro, 2.0 Flash, 3.0 Flash, 3.1 Flash/Lite)
    - **Stock Data**: Yahoo Finance (Primary) and Alpha Vantage (Fallback)
    - **Market Context**: Wikipedia S&P 500 list (Scraped via Axios/Cheerio)
    - **Database**: SQLite (`better-sqlite3`) for persistent favorites/portfolio tracking.
    - **Backend**: Node.js/Express with TypeScript (ESM)
    - **Frontend**: React (Vite) with TypeScript and Glassmorphism design.

## Core Workflows & Logic

### 1. Analysis Caching & Model Selection
- **Persistence**: AI analysis results are stored as `.md` files in `server/analysis/`.
- **Daily Expiration**: The system checks the file's modification date (`mtime`). If it matches the current date (YYYY-MM-DD), the cached analysis is reused.
- **Model Flexibility**: Users can select between various Gemini models (Flash vs Pro, newer vs stable) in the UI. This selection dynamically updates the analysis prompt and processing logic.

### 2. Portfolio Tracking (SQLite)
- **Local Persistence**: Favorite stocks are stored in `stockcoach.db`.
- **Endpoints**:
    - `GET /api/favorites`: Retrieve the list of favorite symbols.
    - `POST /api/favorites`: Add a symbol to favorites.
    - `DELETE /api/favorites/:symbol`: Remove a symbol from favorites.

### 3. Startup & Bulk Processing
- **Cache-Only Startup**: On application load, the `/api/yahoo/analyze-bulk` endpoint is called with `onlyCache: true`. It populates the UI with existing analysis from the cache without calling the Gemini API.
- **Parallel Fetching**: Prices and metadata are fetched in parallel to ensure high responsiveness.
- **Batching**: Bulk operations are processed in optimized batches to stay within API limits while maximizing throughput.

### 4. UI Optimization
- **Ultra-Wide Focus**: Layout optimized for large monitors (95vw width, 1200px max grid height).
- **Glassmorphism**: Modern UI using semi-transparent panels, vivid gradients, and Lucide icons.
- **Responsive Charts**: Interactive price history using Recharts.

## Building and Running

- **Backend (server/)**:
  - `npm run dev`: Starts the server using `tsx watch` for rapid development.
  - `npm run build`: Compiles TypeScript.
  - `npm start`: Runs the compiled server.
- **Frontend (client/)**:
  - `npm run dev`: Starts the Vite dev server.
  - `npm run build`: Builds the production-ready app.

## Development Conventions

- **Full-Stack TypeScript**: Strict typing across both frontend and backend.
- **ESM (ECMAScript Modules)**: The backend uses `"type": "module"`. 
  - **Important**: Relative imports in `.ts` files must include the `.js` extension (e.g., `import { ... } from './service.js'`).
- **AI-First Design**: Leverage Gemini for deep analysis rather than simple rule-based logic.
- **Data Integrity**: Ensure accurate retrieval and validation of stock information. 

## Roadmap & Progress

- [x] **Bulk Analysis Optimization**: Implemented parallel batch processing for cache checks.
- [x] **Automated Bulk Analysis Script**: CLI tool for scraping S&P 500 and generating batch AI reports with rate limiting.
- [x] **Daily Caching**: File-based persistence for analysis results.
- [x] **Cache-Only Startup**: Token-saving initialization mode.
- [x] **Ultra-Wide UI**: Maximized dashboard for large monitors with Glassmorphism.
- [x] **Portfolio Tracking**: Implemented SQLite-based favorites system.
- [x] **Advanced AI Models**: Support for Gemini 3.1 Flash/Lite and 2.0 Flash.
- [x] **Recommendation History**: Tracking and displaying recommendation trends per stock.
- [ ] **Technical Indicator Integration**: Integrate RSI, MACD, and EMA/SMA into the AI prompt.
- [ ] **Sector-Based Comparisons**: Analyze stock performance relative to its S&P 500 sector peers.
- [ ] **News Sentiment Analysis**: Integrate news APIs for broader market context.
- [ ] **Advanced Screener**: Filter S&P 500 list by market cap, sector, volatility, etc.
- [ ] **Automated Alerts**: Push notifications for recommendation shifts.
- [ ] **Portfolio P&L Tracking**: Calculate gains/losses for user portfolios.
- [ ] **Export Options**: Allow users to export analysis reports as PDF or JSON.

---

## Suggested Additional Features

The following features are proposed to significantly deepen the analytical capability, user experience, and long-term utility of StockCoach. Each entry includes context for AI-assisted implementation.

### 🧠 AI & Analysis Enhancements

- [ ] **Multi-Stock Comparative Analysis**
  - Allow users to compare 2–5 stocks side-by-side with a single Gemini prompt that evaluates them as a group.
  - The AI should recommend the strongest relative opportunity given shared sector or market cap context.
  - Frontend: Add a "Compare Mode" toggle that accepts multiple ticker inputs.

- [ ] **Earnings Calendar Integration**
  - Fetch upcoming earnings dates (via Yahoo Finance `quoteSummary.earningsTrend`) and inject them into the Gemini analysis prompt.
  - Include a warning badge on stock cards for stocks with earnings within the next 7 days, since pre-earnings volatility should influence recommendations.

- [ ] **Confidence Score**
  - Extend the Gemini prompt to return a `confidenceScore` (0–100) alongside the recommendation.
  - This score should reflect how certain the model is given data quality, volatility, and trend consistency.
  - Render as a gauge or progress bar in the stock detail panel.

- [ ] **Bear/Bull Case Summary**
  - Ask Gemini to produce a structured `bullCase` and `bearCase` alongside the recommendation — a concise paragraph for each.
  - This mirrors institutional research note formatting and helps users think through both sides before acting.

- [ ] **Macro Context Overlay**
  - Periodically fetch a high-level macroeconomic summary (e.g., Fed rate decisions, CPI, GDP data) using a separate Gemini call and cache it daily.
  - Inject this macro context into individual stock analysis prompts for more grounded recommendations.

---

### 📊 Data & Charting Improvements

- [ ] **Volume Chart Overlay**
  - Alongside the 30-day price chart, render a secondary bar chart showing daily trading volume.
  - Spikes in volume often confirm or contradict price movements and add critical context.
  - Use Yahoo Finance's `chart` API which already returns volume data per candle.

- [ ] **52-Week High/Low Indicator**
  - Display the 52-week high and low on the stock detail card.
  - Add a visual "position indicator" bar showing where the current price sits relative to the annual range.
  - Source from `yahoo-finance2.quote()` which already returns `fiftyTwoWeekHigh` and `fiftyTwoWeekLow`.

- [ ] **Moving Average Lines on Chart**
  - Render the 10-day and 30-day simple moving averages (SMA) as overlapping lines on the price chart.
  - Compute these client-side from the existing `history` array — no additional API calls needed.
  - Crossovers between SMAs are a key technical signal worth surfacing visually.

- [ ] **Candlestick Chart Mode**
  - Add a toggle to switch the Recharts line chart to a candlestick (OHLC) chart.
  - Requires fetching open/high/low/close data per day — available from `yahoo-finance2.chart()`.
  - Candlestick patterns (doji, hammer, engulfing) are standard tools used by traders.

---

### 💼 Portfolio & Watchlist Enhancements

- [ ] **Portfolio Performance Summary**
  - Add a top-level portfolio card showing total invested value, current value, overall P&L, and percentage gain/loss.
  - Fetch live prices for all held symbols in parallel using the existing `/api/yahoo/prices` endpoint.

- [ ] **Target Price & Stop-Loss Tracking**
  - Allow users to set a personal target price and stop-loss price for each portfolio holding.
  - Store in SQLite. Display colored alerts when the live price approaches or breaches these thresholds.

- [ ] **Watchlist Groups / Tags**
  - Allow users to organize favorites into named groups (e.g., "Tech", "Dividends", "High Risk").
  - Store as a `tags` column in the `favorites` SQLite table.
  - Render as collapsible sections in the Favorite Stocks panel.

- [ ] **Import Portfolio from CSV**
  - Allow users to upload a CSV file containing symbol, quantity, and purchase price.
  - Parse it on the backend using Node.js `fs` and batch-insert the holdings into SQLite.
  - Supports migration from brokerage exports (e.g., Fidelity, Schwab).

---

### 🔔 Alerts & Automation

- [ ] **Price Change Alerts (Server-Sent Events)**
  - Implement a lightweight SSE (Server-Sent Events) endpoint that polls prices every 60 seconds for watchlisted stocks.
  - Push a browser notification when a stock moves more than X% from its last known price.
  - Uses the existing `fetchStockPricesYahoo` batch endpoint on the backend.

- [ ] **Recommendation Change Alerts**
  - After each new analysis, compare the new recommendation to the last stored one in `recommendation_history`.
  - If the signal flips (e.g., HOLD → BUY), trigger a browser notification and highlight the card with a pulse animation.

- [ ] **Scheduled Nightly Analysis (Cron)**
  - Add a server-side cron job (via `node-cron`) that runs the bulk analysis script automatically after market close (e.g., 5:00 PM ET).
  - The next morning, the UI will load with fresh, pre-cached recommendations for all S&P 500 stocks with zero wait time.

---

### 🛠️ Developer Experience & Infrastructure

- [ ] **REST API Documentation (Swagger/OpenAPI)**
  - Auto-generate an OpenAPI spec from the existing Express routes using `swagger-jsdoc` and `swagger-ui-express`.
  - Mount it at `/api/docs` for easy reference during development and debugging.

- [ ] **Redis Caching Layer**
  - Replace file-based `.md` caching with a Redis store for faster reads, atomic writes, and TTL-based expiration.
  - Use `ioredis` on the backend. This paves the way for horizontal scaling and multi-instance deployments.

- [ ] **Unit & Integration Tests**
  - Add `vitest` (or `jest`) for backend service tests, covering `aiService`, `stockService`, and `dbService`.
  - Mock Gemini API responses and Yahoo Finance calls to run tests in CI without live API dependencies.

- [ ] **Docker Compose Setup**
  - Add a `docker-compose.yml` that orchestrates the backend server, frontend (nginx-served build), and optionally Redis.
  - Simplifies onboarding for new contributors to a single `docker compose up` command.


# StockCoach

StockCoach is an intelligent, high-performance investment assistant designed to help users make informed decisions in the stock market. By leveraging historical data from **Yahoo Finance** and **Alpha Vantage**, combined with the power of Google's latest **Gemini AI** models, the application provides deep market analysis and personalized stock recommendations.

## Purpose

The primary goal of StockCoach is to bridge the gap between raw financial data and actionable insights. It automates the process of gathering historical stock information, performs deep AI analysis, and offers clear BUY/SELL/HOLD recommendations based on data-driven patterns and institutional-grade reasoning.

## Key Features

- **Full-Stack TypeScript**: Built with a modern, type-safe architecture (React + Express + ESM).
- **Multi-Source Stock Data**: Primarily uses **Yahoo Finance** for robust, real-time and historical data fetching. Supports individual request handling for bulk operations to ensure maximum reliability.
- **Advanced Gemini AI Analysis**: Supports multiple Google Gemini models (1.5 Flash, 1.5 Pro, 2.0 Flash, and newer Flash Lite variants) to process complex financial indicators.
- **Automated S&P 500 Integration**: Scrapes the latest S&P 500 list from Wikipedia on startup, providing an interactive discovery grid with real-time ticker suggestions.
- **Portfolio & Favorites Tracking**: Persistent storage of favorite stocks using a lightweight **SQLite** database for a personalized experience.
- **Smart Analysis Caching**: AI analysis results are cached locally for 24 hours to optimize performance and reduce API token consumption.
- **Ultra-Wide Dashboard**: A "Glassmorphism" UI optimized for large monitors with high-DPI scaling, featuring responsive **Recharts** visualizations and interactive data tables.

## Getting Started

### Prerequisites
- **Node.js**: version 18 or higher.
- **Gemini API Key**: Obtain an API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
- **Alpha Vantage API Key** (Optional): Get a free key [here](https://www.alphavantage.co/support/#api-key) for fallback data sourcing.

### Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd stockcoach
    ```

2.  **Install dependencies**:
    Install packages for both the backend and frontend:
    ```bash
    # Install backend dependencies
    cd server && npm install
    
    # Install frontend dependencies
    cd ../client && npm install
    ```

3.  **Configure Environment Variables**:
    Create a `.env` file in the `server` directory:
    ```bash
    cp server/.env.example server/.env
    ```
    Open `server/.env` and fill in your Gemini API key:
    ```env
    PORT=3001
    GEMINI_API_KEY=your_gemini_api_key
    # Optional: ALPHA_VANTAGE_API_KEY=your_key
    ```

## Running the Application

To run the full application, you need to start both the backend server and the frontend client.

### 1. Start the Backend Server
From the `server/` directory:
```bash
npm run dev
```
The server will start on `http://localhost:3001`. It uses `tsx watch` for rapid development and ESM support.

### 2. Start the Frontend Client
From the `client/` directory:
```bash
npm run dev
```
The frontend will start on `http://localhost:5173` using Vite.

### 3. Running the Bulk Analysis Script
The project includes a script to perform bulk analysis on all S&P 500 companies. This script fetches quotes and history, runs an AI analysis for each stock, and waits 10 seconds between requests to respect API limits.

From the `server/` directory, run:
```bash
npx tsx scripts/bulkAnalyze.ts
```

## Usage

1.  Open your browser to `http://localhost:5173`.
2.  **Explore**: Use the search bar with autocomplete or click any stock in the **S&P 500 Companies** grid.
3.  **Track Favorites**: Click the star icon on any stock card to add it to your persistent **Favorite Stocks** list.
4.  **Analyze**: 
    - Select your preferred AI model from the header (e.g., Gemini 1.5 Flash).
    - Click **Analyze with Gemini** to generate a deep-dive recommendation.
5.  **Visualize**: Interact with 30-day price history charts or toggle the **History Table** for precise price tracking.

## Project Structure

- `client/`: React frontend (Vite + TypeScript + Recharts + Lucide Icons).
- `server/`: Express backend (Node.js + TypeScript + ESM + SQLite).
- `GEMINI.md`: Detailed instructional context and development roadmap for AI interactions.

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## 🌐 High-Level Architecture Overview

The `stockcoach` application operates as a modular, full-stack system built around the data flow from external APIs through an Express backend to a React frontend. The architecture is segmented into clear roles: data acquisition, business logic/caching, and presentation.

### **Components:**
*   **Frontend (`client/`):** A React (Vite) application responsible for rendering the UI and managing user state. It communicates solely with the `/api` endpoints on the backend via HTTP requests.
*   **Backend/API (`server/`):** An Express API layer built with TypeScript that acts as the central control plane. It manages all external communications, data orchestration, rate limiting, and caching.
    *   **Data Services:** Contains services responsible for interacting with various external APIs (Yahoo Finance, Alpha Vantage, Google Gemini).
    *   **Persistence Layer:** Manages two types of storage:
        1.  `server/analysis/*.md`: Cached AI results. These are designed to expire daily based on the file's modification date to prevent the usage of stale analysis data and conserve API tokens.
        2.  `stockcoach.db`: SQLite database, used for storing critical user-specific state, such as favorite stocks.

### **Data Flow & Interactions:**
1.  **User Interaction:** The client initiates a request (e.g., "Analyze AAPL").
2.  **API Request:** The request travels over HTTP to the `server/` API layer.
3.  **Orchestration:** The server first checks its local cache (`analysis/*.md`) using the stock symbol and date. If found and not expired, it serves cached data.
4.  **External Calls (If necessary):** If no valid cache exists, the backend executes external calls to:
    *   Fetch raw financial metrics (Yahoo Finance/Alpha Vantage).
    *   Process structured data using Gemini AI services.
5.  **Persistence & Response:** The result is written back to local cache files *and* sent as a JSON response back through the API to the client for display.

## 🛠️ Common Development Tasks

### **Setup and Installation**
1.  **Prerequisites:** Requires Node.js v18+ runtime. Must set up credentials: Gemini API Key and Alpha Vantage API Key (if used).
2.  **Installation Order:** Always run dependencies sequentially:
    ```bash
    npm install # in the root or top-level directory
    cd server && npm install
    cd ../client && npm install
    ```

### **Development Workflow & Commands**
*   **Start Development Server (Hot Reloading):** Running both services concurrently is required for full functionality.
    ```bash
    # Terminal 1: Run Backend API
    npm run dev # from server/ directory
    # Terminal 2: Run Frontend UI
    npm run dev # from client/ directory
    ```
*   **Linting:** Checks code quality across the entire stack.
    ```bash
    npm run lint # Should be run in root or project-specific directories (e.g., server/)
    ```
*   **Building for Production:** Compiles all TypeScript and bundles assets for deployment readiness. This process is handled by `tsc -b` for the backend and Vite/Webpack for the client.
    ```bash
    npm run build # From root or applicable directory
    ```

### **Testing Specifics**
The project structure suggests a standard unit testing setup, but explicit single-test running commands need verification against the specific package manager configuration (`package*.json`). Assume a general command like `npm test -- [file]`. *If this fails, check the root/server/package.json for the exact test script.*

*   **Example (Assuming Jest/Vitest):** To run tests specifically for the favorite stock API handler:
    ```bash
    npx jest ./server/tests/api/favorites.test.ts
    ```

## 📜 Specialized Guidelines

*   **Documentation Source of Truth:** The `server/GEMINI.md` file is the canonical guide for how AI analysis, model selection (e.g., Gemini 1.5 Flash), and complex data structuring should occur. Changes to AI logic *must* start here.
*   **API Endpoints:** Use `/api/favorites` for managing user favorite stocks. All frontend actions related to state persistence flow through this API endpoint.

### **Absence of External Rulesets**
The directory structure does not contain any files indicating specific `.cursor/rules/` or `.github/copilot-instructions.md`. If custom developer rules exist, they must be manually documented in this file.
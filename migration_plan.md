# Migration Plan: @google/generative-ai &rarr; @google/genai

This plan outlines the steps to migrate the StockCoach backend from the legacy `@google/generative-ai` SDK to the modern `@google/genai` SDK.

---

## Step 1: Update Dependencies
Uninstall the legacy package and install the new package in the `server` directory:

```bash
cd server
npm uninstall @google/generative-ai
npm install @google/genai
```

---

## Step 2: Refactor `aiService.ts`
We need to modify [aiService.ts](file:///mnt/c/Github/stockcoach/server/src/services/aiService.ts) to:
1. Import `GoogleGenAI` from `@google/genai` instead of `GoogleGenerativeAI` from `@google/generative-ai`.
2. Initialize the client using the new constructor syntax: `new GoogleGenAI({ apiKey })`.
3. Use the new models API structure: `ai.models.generateContent({ model, contents })`.
4. Access response text using the `.text` property rather than `.text()`.

### Code Diff:

```diff
-import { GoogleGenerativeAI } from '@google/generative-ai';
+import { GoogleGenAI } from '@google/genai';
 import * as logger from '../utils/logger.js';
 import { writeFile, mkdir, readFile, stat } from 'fs/promises';
 import path from 'path';
...
-  const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
-  const model = genAI.getGenerativeModel({ model: modelName });
+  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
 
   const prompt = `
     Act as a highly experienced, institutional-grade stock trading advisor and risk manager. Analyze the following stock data for ${symbol} and provide a recommendation (BUY, SELL, or HOLD).
     Include a concise reasoning block.
 
     Current Quote:
     ${JSON.stringify(stockData, null, 2)}
 
     Historical Data (recent):
     ${JSON.stringify(history, null, 2).slice(0, 1000)} ... (truncated)
 
     Format your response as a JSON object:
     {
       "recommendation": "BUY/SELL/HOLD",
       "reasoning": "...",
       "keyInsights": ["...", "..."]
     }
   `;
 
   try {
-    const result = await model.generateContent(prompt);
-    const response = await result.response;
-    const text = response.text();
+    const response = await ai.models.generateContent({
+      model: modelName,
+      contents: prompt,
+    });
+    const text = response.text;
```

---

## Step 3: Verification & Compilation
Validate the refactored code compilation by running the TypeScript build script:

```bash
cd server
npm run build
```

Then, verify the server starts successfully and is able to run stock analyses.

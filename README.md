# Lumina (Frontend)

Lumina is the React + Vite frontend for **Stock_Price_Analyze**. It’s designed for fast stock exploration with Bollinger-band based signals, watch-list workflows, and financial statement trend visualizations.

## 2025 Trading Results (Live)

These are my **calendar-year 2025** live trading results, summarized at the "strategy / campaign" level (a campaign can contain multiple trade legs).

- **Starting capital:** $50,025.75
- **Total return:** +24.86% (+$12,436.44)
- **# strategies (campaigns):** 139
- **Win rate:** 65.47% (91 wins / 48 losses)
- **Typical risk per strategy (median losing campaign):** $891.51
- **Worst single strategy:** -$15,334.56 (TSLA campaign; 11 legs)
- **Max drawdown (realized campaign equity curve):** -$30,520.69 (56.64%)

**Professional quality metrics**

| Metric | Value |
| --- | --- |
| Profit factor (gross profit / gross loss) | 1.140 |
| Payoff ratio (avg win / avg loss) | 0.601 |
| Expectancy (per strategy) | +$89.47 |
| Sharpe (realized-daily) | 1.222 |
| Sortino (realized-daily) | 1.250 |
| VaR(95) (per strategy) | -$3,180 |
| CVaR(95) (per strategy) | -$6,527 |

**Where PnL came from (concentration / diagnostics)**

| Category | Symbol | Net PnL | Campaigns | Win rate |
| --- | --- | ---: | ---: | ---: |
| Top contributor | TQQQ | +$22,114 | 26 | 80.8% |
| Top contributor | NVDL | +$11,255 | 13 | 100% |
| Top contributor | NFLX | +$6,548 | 15 | 60.0% |
| Biggest drag | TSLA | -$14,689 | 6 | - |
| Biggest drag | QQQ | -$10,227 | 33 | - |
| Biggest drag | META | -$5,763 | 28 | - |

Full write-up: [CASE_STUDY_2025_TRADING.md](https://github.com/chaofengh/lumina-live-results-notes/blob/main/CASE_STUDY_2025_TRADING.md)

## Key features

### 1) Bollinger-band signals + quantified P&L
![Image Alt](https://github.com/chaofengh/stock_price_analyze_frontend/blob/96c610297de38aa3e36a6cdf3d4b3ee2d317411b/Buy%20-%20selling%20signal.png)


- Price chart overlays **Upper / Lower Bollinger Bands** and highlights band-touch signal days.
- Signals are interpreted as:
  - **Lower-band touch + bounce → Long signal**
  - **Upper-band touch + pullback → Short signal**
- Each signal includes **quantified outcomes** (dollars + percent), shown in:
  - An interactive hover tooltip with P&L micro-bars
  - A **Performance Blotter** listing entry/exit + P&L for 5-day and 10-day windows

#### 2)Daily Bollinger Alerts
![Image Alt](https://github.com/chaofengh/stock_price_analyze_frontend/blob/a8ef87c025752a0c16144937393647794d5001ea/alert.png)

- The header **notification bell** surfaces daily tickers that crossed above the **Upper** or below the **Lower** Bollinger Band.
- Alerts are **grouped by side** (Upper/Lower), sortable, and deep-link into the dashboard so you can inspect the move and signals for that symbol.
- Each alert includes an **Overbought/Oversold breakout meter** that visualizes how far price broke beyond the touched band.
- Alerts auto-refresh while you’re logged in (polling interval configurable via `REACT_APP_ALERTS_POLL_MS`), and refresh when the tab regains focus.

**Demo Video**
- Bollinger buy/sell signals + P&L: https://app.supademo.com/demo/cml2zwevw299izsadoiq8k834?utm_source=link

### 3) Watch list + A/B testing for suggestions

![Image Alt](https://github.com/chaofengh/stock_price_analyze_frontend/blob/b6894648b40a41de87c5fd4150ac2b0c3968106e/watchlist.png)
- Authenticated watch list (add/remove tickers, bulk delete, multi-select).
- Onboarding “Quest” card with starter-ticker suggestions to help users build an initial list.
- Experiment support using **PostHog feature flags + experiments** for the watch list empty state.
  - **Experiment:** “Suggestions vs message → watchlist length” (Bayesian, 95% credibility interval)
  - **Hypothesis:** Ticker suggestions will increase the length of users’ watchlists.
  - **Variants:**
    - `control`: show a simple empty-state message (“Your watch list is empty…”)
    - `test`: show clickable starter-ticker suggestions (Quest card chips)
  - **Exposure logging (important for clean A/B tests):**
    - Exposure is counted when the empty state actually renders and the flag is evaluated (PostHog `$feature_flag_called`).
    - A debug event `watchlist_empty_state_viewed` is also captured with `flag_key`, `flag_value`, and `suggestions_enabled` so the variant can be joined back to behavior.
    - Client-side dedupe prevents double-counting exposures on re-renders.
  - **Primary metric (success):**
    - `watchlist_ticker_added` (mean), including `watchlist_count_after` to quantify watchlist-length lift after each add.
  - **Guardrails / diagnostics:**
    - `watchlist_session_ended` (mean), capturing `duration_ms`, `watchlist_length`, and `exit_reason` to ensure we don’t harm engagement.
    - Bounce-rate ratio via `watchlist_session_ended` where `is_bounce=true` (bounce threshold configurable via `REACT_APP_WATCHLIST_BOUNCE_MS`).
    - `$exception` and `watchlist_error` to ensure the experiment doesn’t increase crashes or API failure rates.
**Demo Video**
- A/B testing (watch list suggestions): https://app.supademo.com/demo/cml2z9hdv28x6zsadagiuzype?utm_source=link

### 4) Financial reports (quarterly + annual trend views)

![Image Alt](https://github.com/chaofengh/stock_price_analyze_frontend/blob/6340bfb0f459e1c6121f764ba523e6233ffe4a95/financial%20reports.png)
- Financial statements UI with **Income Statement**, **Balance Sheet**, and **Cash Flow** tabs.
- Toggle between **quarterly** and **annual (or year-to-date)** views.
- Visual trend exploration via charts and comparison tables.
**Demo Video**
- Financial reports (quarterly + annual): https://app.supademo.com/demo/cml30j3li29hszsadnwity1r3?utm_source=link

## Pages / routes

- `/` — Stock dashboard (chart, KPIs, performance blotter)
- `/watchlist` — Watch list management
- `/analysis/:symbol` — Financial reports
- `/backtest` — Strategy backtest explorer (P&L heatmap + intraday candles + trade annotations)
- `/news` — Market news feed (Finnhub)
- `/option-price-ratio` — Option price ratio stream (requires auth)

## Getting started

### Prerequisites

- Node.js 18+ and npm

### Configure environment

This app uses Vite, but keeps CRA-style `REACT_APP_` environment variables (see `vite.config.mjs`).

Create `stock_price_analyze_frontend/.env.local` (recommended) or edit `stock_price_analyze_frontend/.env`:

```bash
# Backend base URL (should already include /api)
REACT_APP_summary_root_api=http://localhost:5000/api

# Finnhub (used by symbol search + news)
REACT_APP_Finnhub_API_Key=your_key_here

# PostHog (analytics + feature-flag experiments)
REACT_APP_POSTHOG_HOST=https://us.i.posthog.com
REACT_APP_POSTHOG_KEY=phc_your_key_here

# Optional
REACT_APP_ALERTS_POLL_MS=1800000
REACT_APP_WATCHLIST_BOUNCE_MS=8000
REACT_APP_EXPERIMENT_WATCHLIST_SUGGESTIONS_EMPTY_FLAG=exp_watchlist_suggestions_empty_state
```

### Run locally

```bash
cd stock_price_analyze_frontend
npm install
npm start
```

Open http://localhost:3000

## Scripts

- `npm start` — run the dev server
- `npm test` — run unit tests (Vitest)
- `npm run build` — build to `build/`
- `npm run preview` — serve the production build locally

## Tests

### Unit tests (Vitest)

```bash
cd stock_price_analyze_frontend
npm test
```

### E2E tests (Playwright)

```bash
cd stock_price_analyze_frontend
npx playwright test
```

Playwright will inject safe defaults for key env vars unless you set `PLAYWRIGHT_USE_REAL_ENV=1` (see `playwright.config.js`).

## Disclaimer

This project is for research/education and does not constitute financial advice.

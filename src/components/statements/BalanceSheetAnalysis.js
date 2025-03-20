// /components/statements/BalanceSheetAnalysis.js
import React, { useCallback } from 'react';
import FinancialAnalysisBase from './FinancialAnalysisBase';
import { fetchBalanceSheet } from '../Redux/financialsSlice';

// The metrics you want to show in the sidebar
const BALANCE_METRICS = [
  { key: 'totalAssets', label: 'Total Assets ($)', isPercentage: false },
  { key: 'totalLiabilities', label: 'Total Liabilities ($)', isPercentage: false },
  { key: 'totalEquity', label: "Shareholders' Equity ($)", isPercentage: false },
  { key: 'currentAssets', label: 'Current Assets ($)', isPercentage: false },
  { key: 'currentLiabilities', label: 'Current Liabilities ($)', isPercentage: false },
];

function BalanceSheetAnalysis({ symbol }) {
  // Functions to transform the raw annual/quarterly arrays into
  // a simplified shape for the base component.
  const processAnnualReports = useCallback((annualReports) => {
    const arr = annualReports.map((report) => {
      const year = report.fiscalDateEnding.split('-')[0];
      return {
        year,
        totalAssets: Number(report.totalAssets) || 0,
        totalLiabilities: Number(report.totalLiabilities) || 0,
        totalEquity: Number(report.totalEquity) || 0,
        currentAssets: Number(report.currentAssets) || 0,
        currentLiabilities: Number(report.currentLiabilities) || 0,
      };
    });
    // Sort ascending by year
    arr.sort((a, b) => a.year.localeCompare(b.year));
    // Keep the last 8 for the chart
    return arr.slice(-8);
  }, []);

  const getQuarter = (month) => {
    if (['01', '02', '03'].includes(month)) return 'Q1';
    if (['04', '05', '06'].includes(month)) return 'Q2';
    if (['07', '08', '09'].includes(month)) return 'Q3';
    return 'Q4';
  };

  const processQuarterlyReports = useCallback((quarterlyReports) => {
    const arr = quarterlyReports.map((report) => {
      const [year, month] = report.fiscalDateEnding.split('-');
      return {
        year,
        quarter: getQuarter(month),
        totalAssets: Number(report.totalAssets) || 0,
        totalLiabilities: Number(report.totalLiabilities) || 0,
        totalEquity: Number(report.totalEquity) || 0,
        currentAssets: Number(report.currentAssets) || 0,
        currentLiabilities: Number(report.currentLiabilities) || 0,
      };
    });
    // Sort by year, then quarter
    arr.sort((a, b) => {
      if (a.year !== b.year) return a.year.localeCompare(b.year);
      const order = { Q1: 1, Q2: 2, Q3: 3, Q4: 4 };
      return order[a.quarter] - order[b.quarter];
    });
    return arr;
  }, []);

  return (
    <FinancialAnalysisBase
      symbol={symbol}
      fetchDataThunk={fetchBalanceSheet}
      selectDataFromStore={(state) => state.financials.balanceSheet}
      selectLoadingFromStore={(state) => state.financials.loadingBalanceSheet}
      selectErrorFromStore={(state) => state.financials.errorBalanceSheet}
      processAnnualReports={processAnnualReports}
      processQuarterlyReports={processQuarterlyReports}
      metrics={BALANCE_METRICS}
      chartColor="rgba(153, 102, 255, 0.8)"
      sidebarTitle="Balance Sheet Metrics"
    />
  );
}

export default BalanceSheetAnalysis;

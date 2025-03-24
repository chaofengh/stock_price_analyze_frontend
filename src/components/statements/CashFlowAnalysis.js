// /components/statements/CashFlowAnalysis.js
import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import FinancialAnalysisBase from './FinancialAnalysisBase';
import { fetchCashFlow } from '../Redux/financialsSlice';

// 1. Updated list of metrics to display
const CASHFLOW_METRICS = [
  { key: 'operatingCashflow', label: 'Operating Cash Flow ($)', isPercentage: false },
  { key: 'depreciationDepletionAndAmortization', label: 'Depreciation & Amortization ($)', isPercentage: false },
  { key: 'changeInOperatingAssets', label: 'Change in Operating Assets ($)', isPercentage: false },
  { key: 'changeInOperatingLiabilities', label: 'Change in Operating Liabilities ($)', isPercentage: false },
  { key: 'capitalExpenditures', label: 'Capital Expenditures ($)', isPercentage: false },
  { key: 'dividendPayout', label: 'Dividend Payout ($)', isPercentage: false },
  { key: 'freeCashFlow', label: 'Free Cash Flow ($)', isPercentage: false },
  { key: 'investingCashflow', label: 'Investing Cash Flow ($)', isPercentage: false },
  { key: 'financingCashflow', label: 'Financing Cash Flow ($)', isPercentage: false },
];

function CashFlowAnalysis({ symbol }) {
  // 2. Access your Redux state
  const cashFlow = useSelector((state) => state.financials.cashFlow);
  console.log(cashFlow);

  // 3. Process annual reports
  const processAnnualReports = useCallback((annualReports) => {
    const arr = annualReports.map((report) => {
      const year = report.fiscalDateEnding.split('-')[0];

      // Convert fields from strings to numbers safely (handle "None" or missing data)
      const operatingCash = Number(report.operatingCashflow) || 0;
      const capex = Number(report.capitalExpenditures) || 0;

      return {
        year,
        operatingCashflow: operatingCash,
        depreciationDepletionAndAmortization: Number(report.depreciationDepletionAndAmortization) || 0,
        changeInOperatingAssets: Number(report.changeInOperatingAssets) || 0,
        changeInOperatingLiabilities: Number(report.changeInOperatingLiabilities) || 0,
        capitalExpenditures: capex,
        dividendPayout: Number(report.dividendPayout) || 0,
        freeCashFlow: operatingCash + capex, // Typically Operating CF - CapEx, watch sign
        investingCashflow: Number(report.investingCashflow) || 0,
        financingCashflow: Number(report.financingCashflow) || 0,
      };
    });
    arr.sort((a, b) => a.year.localeCompare(b.year));
    return arr.slice(-8);
  }, []);

  // 4. Helper to determine quarter
  const getQuarter = (month) => {
    if (['01', '02', '03'].includes(month)) return 'Q1';
    if (['04', '05', '06'].includes(month)) return 'Q2';
    if (['07', '08', '09'].includes(month)) return 'Q3';
    return 'Q4';
  };

  // 5. Process quarterly reports
  const processQuarterlyReports = useCallback((quarterlyReports) => {
    const arr = quarterlyReports.map((report) => {
      const [year, month] = report.fiscalDateEnding.split('-');
      const operatingCash = Number(report.operatingCashflow) || 0;
      const capex = Number(report.capitalExpenditures) || 0;

      return {
        year,
        quarter: getQuarter(month),
        operatingCashflow: operatingCash,
        depreciationDepletionAndAmortization: Number(report.depreciationDepletionAndAmortization) || 0,
        changeInOperatingAssets: Number(report.changeInOperatingAssets) || 0,
        changeInOperatingLiabilities: Number(report.changeInOperatingLiabilities) || 0,
        capitalExpenditures: capex,
        dividendPayout: Number(report.dividendPayout) || 0,
        freeCashFlow: operatingCash + capex, // Typically Operating CF - CapEx
        investingCashflow: Number(report.investingCashflow) || 0,
        financingCashflow: Number(report.financingCashflow) || 0,
      };
    });

    // Sort by year then by quarter
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
      fetchDataThunk={fetchCashFlow}
      selectDataFromStore={(state) => state.financials.cashFlow}
      selectLoadingFromStore={(state) => state.financials.loadingCashFlow}
      selectErrorFromStore={(state) => state.financials.errorCashFlow}
      processAnnualReports={processAnnualReports}
      processQuarterlyReports={processQuarterlyReports}
      metrics={CASHFLOW_METRICS}
      chartColor="rgba(75, 192, 192, 0.8)"
      sidebarTitle="Cash Flow Metrics"
    />
  );
}

export default CashFlowAnalysis;

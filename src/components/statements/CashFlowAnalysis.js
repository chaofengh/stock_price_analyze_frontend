// /components/statements/CashFlowAnalysis.js
import React, { useCallback } from 'react';
import FinancialAnalysisBase from './FinancialAnalysisBase';
import { fetchCashFlow } from '../Redux/financialsSlice';

const CASHFLOW_METRICS = [
  { key: 'operatingCashflow', label: 'Operating Cash Flow ($)', isPercentage: false },
  { key: 'capitalExpenditures', label: 'Capital Expenditures ($)', isPercentage: false },
  { key: 'freeCashFlow', label: 'Free Cash Flow ($)', isPercentage: false },
  { key: 'investingCashflow', label: 'Investing Cash Flow ($)', isPercentage: false },
  { key: 'financingCashflow', label: 'Financing Cash Flow ($)', isPercentage: false },
];

function CashFlowAnalysis({ symbol }) {
  const processAnnualReports = useCallback((annualReports) => {
    const arr = annualReports.map((report) => {
      const year = report.fiscalDateEnding.split('-')[0];
      const operating = Number(report.operatingCashflow) || 0;
      const capex = Number(report.capitalExpenditures) || 0;
      return {
        year,
        operatingCashflow: operating,
        capitalExpenditures: capex,
        freeCashFlow: operating + capex,
        investingCashflow: Number(report.investingCashflow) || 0,
        financingCashflow: Number(report.financingCashflow) || 0,
      };
    });
    arr.sort((a, b) => a.year.localeCompare(b.year));
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
      const operating = Number(report.operatingCashflow) || 0;
      const capex = Number(report.capitalExpenditures) || 0;
      return {
        year,
        quarter: getQuarter(month),
        operatingCashflow: operating,
        capitalExpenditures: capex,
        freeCashFlow: operating + capex,
        investingCashflow: Number(report.investingCashflow) || 0,
        financingCashflow: Number(report.financingCashflow) || 0,
      };
    });
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

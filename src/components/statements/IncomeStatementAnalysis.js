// /components/statements/IncomeStatementAnalysis.js
import React, { useCallback } from 'react';
import FinancialAnalysisBase from './FinancialAnalysisBase';
import { fetchIncomeStatement } from '../Redux/financialsSlice';

const INCOME_METRICS = [
  { key: 'totalRevenue', label: 'Revenue ($)', isPercentage: false },
  { key: 'grossProfit', label: 'Gross Profit ($)', isPercentage: false },
  { key: 'operatingIncome', label: 'Operating Income ($)', isPercentage: false },
  { key: 'ebitda', label: 'EBITDA ($)', isPercentage: false },
  { key: 'operatingExpenses', label: 'Operating Expenses ($)', isPercentage: false },
  { key: 'researchAndDevelopment', label: 'R&D ($)', isPercentage: false },
  { key: 'netIncome', label: 'Net Income ($)', isPercentage: false },
  { key: 'grossMargin', label: 'Gross Margin (%)', isPercentage: true },
  { key: 'netMargin', label: 'Net Margin (%)', isPercentage: true },
];

function IncomeStatementAnalysis({ symbol, incomeStatementData }) {
  const processAnnualReports = useCallback((annualReports) => {
    const arr = annualReports.map((report) => {
      const fallbackYear =
        report.fiscalDateEnding?.split('-')[0] || report.year || 'N/A';
      const year = report.year || fallbackYear;
      const quarterRange = report.quarterRange || null;
      const totalRevenue = Number(report.totalRevenue) || 0;
      const grossProfit = Number(report.grossProfit) || 0;
      const operatingIncome = Number(report.operatingIncome) || 0;
      const ebitda = Number(report.ebitda) || 0;
      const netIncome = Number(report.netIncome) || 0;
      const operatingExpenses = Number(report.operatingExpenses) || 0;
      const researchAndDevelopment =
        Number(report.researchAndDevelopment) || 0;

      const grossMargin = totalRevenue ? (grossProfit / totalRevenue) * 100 : 0;
      const netMargin = totalRevenue ? (netIncome / totalRevenue) * 100 : 0;

      return {
        year,
        displayLabel: quarterRange ? `${year} (${quarterRange})` : year,
        quarterRange,
        totalRevenue,
        grossProfit,
        operatingIncome,
        ebitda,
        operatingExpenses,
        researchAndDevelopment,
        netIncome,
        grossMargin,
        netMargin,
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
      const totalRevenue = Number(report.totalRevenue) || 0;
      const grossProfit = Number(report.grossProfit) || 0;
      const operatingIncome = Number(report.operatingIncome) || 0;
      const ebitda = Number(report.ebitda) || 0;
      const netIncome = Number(report.netIncome) || 0;
      const operatingExpenses = Number(report.operatingExpenses) || 0;
      const researchAndDevelopment =
        Number(report.researchAndDevelopment) || 0;

      const grossMargin = totalRevenue ? (grossProfit / totalRevenue) * 100 : 0;
      const netMargin = totalRevenue ? (netIncome / totalRevenue) * 100 : 0;

      return {
        year,
        quarter: getQuarter(month),
        totalRevenue,
        grossProfit,
        operatingIncome,
        ebitda,
        operatingExpenses,
        researchAndDevelopment,
        netIncome,
        grossMargin,
        netMargin,
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
      initialData={incomeStatementData}
      fetchDataThunk={fetchIncomeStatement}
      selectDataFromStore={(state) => state.financials.incomeStatement}
      selectLoadingFromStore={(state) => state.financials.loadingIncomeStatement}
      selectErrorFromStore={(state) => state.financials.errorIncomeStatement}
      processAnnualReports={processAnnualReports}
      processQuarterlyReports={processQuarterlyReports}
      metrics={INCOME_METRICS}
      chartColor="rgba(255, 159, 64, 0.85)"
      sidebarTitle="Income Statement Metrics"
    />
  );
}

export default IncomeStatementAnalysis;

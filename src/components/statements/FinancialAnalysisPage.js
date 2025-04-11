import React, { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { Box, Tabs, Tab } from '@mui/material';

import IncomeStatementAnalysis from './IncomeStatementAnalysis';
import BalanceSheetAnalysis from './BalanceSheetAnalysis';
import CashFlowAnalysis from './CashFlowAnalysis';

function FinancialAnalysisPage() {
  // Grab the `:symbol` from the URL
  const { symbol } = useParams();

  // If you also passed route state, you can read it here:
  const location = useLocation();
  const { income_statement } = location.state || {};

  // For demonstration, I'm storing the tab selection in state:
  const [selectedTab, setSelectedTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  // If you want to do a fetch based on the symbol from the URL,
  // you could do something like this:
  useEffect(() => {
    if (!income_statement) {
      // fetch the data from your API instead
      // e.g., fetchIncomeStatement(symbol).then(...)
    }
  }, [symbol, income_statement]);

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Tabs value={selectedTab} onChange={handleTabChange}>
        <Tab label="Income Statement" />
        <Tab label="Balance Sheet" />
        <Tab label="Cash Flow" />
      </Tabs>

      {/* If we had the data in route state, we can pass it directly */}
      {selectedTab === 0 && income_statement && (
        <IncomeStatementAnalysis incomeStatementData={income_statement} />
      )}
      {selectedTab === 1 && <BalanceSheetAnalysis symbol={symbol} />}
      {selectedTab === 2 && <CashFlowAnalysis symbol={symbol} />}
    </Box>
  );
}

export default FinancialAnalysisPage;

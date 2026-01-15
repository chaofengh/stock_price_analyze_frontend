import React, { useState } from 'react';
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

  return (
    <Box sx={{ width: '100%', height: '100%', minHeight: 0 }}>
      <Tabs value={selectedTab} onChange={handleTabChange}>
        <Tab label="Income Statement" />
        <Tab label="Balance Sheet" />
        <Tab label="Cash Flow" />
      </Tabs>

      {/* If we had the data in route state, we can pass it directly */}
      {selectedTab === 0 && (
        <IncomeStatementAnalysis
          symbol={symbol}
          incomeStatementData={income_statement}
        />
      )}
      {selectedTab === 1 && <BalanceSheetAnalysis symbol={symbol} />}
      {selectedTab === 2 && <CashFlowAnalysis symbol={symbol} />}
    </Box>
  );
}

export default FinancialAnalysisPage;

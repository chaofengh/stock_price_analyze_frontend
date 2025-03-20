// FinancialAnalysisPage.js
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Tabs, Tab } from '@mui/material';

import IncomeStatementAnalysis from './IncomeStatementAnalysis';
import BalanceSheetAnalysis from './BalanceSheetAnalysis';
import CashFlowAnalysis from './CashFlowAnalysis';

function FinancialAnalysisPage() {
  const location = useLocation();
  const { income_statement } = location.state || {};
  const symbol = income_statement.symbol;

  const [selectedTab, setSelectedTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  return (
    <Box sx={{ width: '100%', p: 2 }}>
      <Tabs value={selectedTab} onChange={handleTabChange}>
        <Tab label="Income Statement" />
        <Tab label="Balance Sheet" />
        <Tab label="Cash Flow" />
      </Tabs>

      {selectedTab === 0 && (
        <IncomeStatementAnalysis incomeStatementData={income_statement} />
      )}
      {selectedTab === 1 && <BalanceSheetAnalysis symbol={symbol}/>}
      {selectedTab === 2 && <CashFlowAnalysis symbol={symbol}/>}
    </Box>
  );
}

export default FinancialAnalysisPage;

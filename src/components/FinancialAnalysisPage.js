// src/components/FinancialAnalysisPage.js
import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Box, Tabs, Tab } from '@mui/material';

import IncomeStatementAnalysis from './statements/IncomeStatementAnalysis';
import BalanceSheetAnalysis from './statements/BalanceSheetAnalysis';
import CashFlowAnalysis from './statements/CashFlowAnalysis';

function FinancialAnalysisPage() {
  const location = useLocation();
  const { income_statement, balance_sheet, cash_flow } = location.state || {};

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
      {selectedTab === 1 && <BalanceSheetAnalysis />}
      {selectedTab === 2 && <CashFlowAnalysis />}
    </Box>
  );
}

export default FinancialAnalysisPage;

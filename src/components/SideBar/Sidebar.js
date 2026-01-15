import React, { useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import AnnualFinancials from './AnnualFinancials';
import BollingerMicroPanel from './BBStat/BollingerMicroPanel';
import PeopleAlsoView from './PeopleAlsoView/PeopleAlsoView';      
import { fetchIncomeStatement } from '../Redux/financialsSlice';

const Sidebar = ({ summary, error, chartRange }) => {
  const dispatch = useDispatch();
  const incomeStatement = useSelector((state) => state.financials.incomeStatement);
  const loadingIncomeStatement = useSelector(
    (state) => state.financials.loadingIncomeStatement
  );
  const incomeStatementError = useSelector(
    (state) => state.financials.errorIncomeStatement
  );
  const currentSymbol = useSelector((state) => state.summary.currentSymbol);
  const peerLoadingState = useSelector((state) => state.summary.peerLoading);
  const symbol = summary?.symbol || currentSymbol;
  const incomeSymbol = incomeStatement?.symbol;
  const peerLoading = peerLoadingState;
  const incomeMatches = incomeSymbol === symbol;
  const annualReports = incomeMatches ? incomeStatement?.annualReports : [];
  const showIncomeLoading = Boolean(symbol) && (loadingIncomeStatement || !incomeMatches);

  useEffect(() => {
    if (!symbol) return;
    if (loadingIncomeStatement) return;
    if (incomeSymbol === symbol) return;
    dispatch(fetchIncomeStatement(symbol));
  }, [dispatch, symbol, incomeSymbol, loadingIncomeStatement]);

  return (
    <div sx={{ p: 3, mb: 3 }}>
      {error && (
        <Typography variant="body2" color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {summary && (
        <Box>
          <BollingerMicroPanel summary={summary} range={chartRange} />
          <AnnualFinancials
            isLoading={showIncomeLoading}
            annualReports={annualReports || []}
          />
          <PeopleAlsoView summary={summary} isLoading={peerLoading} />
          {incomeStatementError && (
            <Typography variant="body2" color="error" sx={{ mt: 2 }}>
              {incomeStatementError}
            </Typography>
          )}
        </Box>
      )}
    </div>
  );
};

export default Sidebar;

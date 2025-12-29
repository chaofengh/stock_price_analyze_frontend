import React, { useEffect } from 'react';
import { Box, Typography } from '@mui/material';
import { useDispatch, useSelector } from 'react-redux';
import AnnualFinancials from './AnnualFinancials';
import BollingerMicroPanel from './BBStat/BollingerMicroPanel';
import PeopleAlsoView from './PeopleAlsoView/PeopleAlsoView';      
import { fetchIncomeStatement } from '../Redux/financialsSlice';

const Sidebar = ({ summary, error }) => {
  const dispatch = useDispatch();
  const incomeStatement = useSelector((state) => state.financials.incomeStatement);
  const loadingIncomeStatement = useSelector(
    (state) => state.financials.loadingIncomeStatement
  );
  const peerLoadingState = useSelector((state) => state.summary.peerLoading);
  const symbol = summary?.symbol;
  const incomeSymbol = incomeStatement?.symbol;
  const isPending = summary?.status === 'pending';
  const peerLoading = peerLoadingState;

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
          <BollingerMicroPanel summary={summary} />
          <PeopleAlsoView summary={summary} isLoading={peerLoading} />
          <AnnualFinancials
            isLoading={loadingIncomeStatement}
            annualReports={
              incomeStatement
                ? incomeStatement.annualReports
                : []
            }
          />

        </Box>
      )}
    </div>
  );
};

export default Sidebar;

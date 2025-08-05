import React from 'react';
import { Box, Paper, Typography, Divider } from '@mui/material';
import KpiTiles from './KpiTiles';
import AnnualFinancials from './AnnualFinancials';
import BollingerMicroPanel from './BollingerMicroPanel';
import PeopleAlsoView from './PeopleAlsoView';      

const Sidebar = ({ summary, error }) => {
  return (
    <Paper sx={{ p: 3, mb: 3 }} elevation={1}>
      {error && (
        <Typography variant="body2" color="error" sx={{ mb: 2 }}>
          {error}
        </Typography>
      )}

      {summary && (
        <Box>
          <BollingerMicroPanel summary={summary} />
          <PeopleAlsoView summary={summary} />
          <KpiTiles summary={summary} />

          <Divider sx={{ my: 3 }} />


          <AnnualFinancials
            annualReports={
              summary.income_statement
                ? summary.income_statement.annualReports
                : []
            }
          />

        </Box>
      )}
    </Paper>
  );
};

export default Sidebar;

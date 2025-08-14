import React from 'react';
import { Box, Typography } from '@mui/material';
import AnnualFinancials from './AnnualFinancials';
import BollingerMicroPanel from './BBStat/BollingerMicroPanel';
import PeopleAlsoView from './PeopleAlsoView/PeopleAlsoView';      

const Sidebar = ({ summary, error }) => {
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
          <PeopleAlsoView summary={summary} />
          <AnnualFinancials
            annualReports={
              summary.income_statement
                ? summary.income_statement.annualReports
                : []
            }
          />

        </Box>
      )}
    </div>
  );
};

export default Sidebar;

import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { render, screen } from '@testing-library/react';
import { ThemeProvider } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';

import SidebarRail from './SidebarRail';
import theme from '../../theme';

const makeStore = (accessToken = null) =>
  configureStore({
    reducer: {
      auth: (state = { accessToken }) => state,
    },
  });

const renderRail = ({ route = '/', summary = null, accessToken = null } = {}) => {
  const store = makeStore(accessToken);
  return render(
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <MemoryRouter initialEntries={[route]}>
          <SidebarRail summary={summary} railWidth={176} />
        </MemoryRouter>
      </ThemeProvider>
    </Provider>
  );
};

describe('SidebarRail entry decision button', () => {
  it('is disabled when there is no active symbol', () => {
    renderRail({ route: '/news' });

    const button = screen.getByLabelText('Entry decision');
    expect(button).toHaveClass('Mui-disabled');
  });

  it('links to /entry-decision with active symbol and marks current page', () => {
    renderRail({
      route: '/entry-decision?symbol=AAPL',
      summary: { symbol: 'AAPL' },
    });

    const button = screen.getByLabelText('Entry decision');
    expect(button).toHaveAttribute('href', '/entry-decision?symbol=AAPL');
    expect(button).toHaveAttribute('aria-current', 'page');
  });
});

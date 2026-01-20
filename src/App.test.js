import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { vi } from 'vitest';
import { act } from 'react';
import App from './App';
import { store } from './components/Redux/store';
import { fetchWorldMarketMoves } from './API/StockService';

vi.mock('./API/StockService', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    fetchWorldMarketMoves: vi.fn(),
  };
});

test('renders app title', async () => {
  let resolveWorldMarketMoves;
  fetchWorldMarketMoves.mockReturnValue(
    new Promise((resolve) => {
      resolveWorldMarketMoves = resolve;
    })
  );

  render(
    <Provider store={store}>
      <App />
    </Provider>
  );
  expect(screen.getByText('Lumina')).toBeInTheDocument();

  await act(async () => {
    resolveWorldMarketMoves({ markets: [], as_of: null });
  });
});

import { render, screen } from '@testing-library/react';
import App from './App';

test('renders available pets heading', async () => {
  render(<App />);
  const heading = await screen.findByText(/available pets/i);
  expect(heading).toBeInTheDocument();
});

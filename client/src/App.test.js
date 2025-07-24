import { render, screen } from '@testing-library/react';
import App from './App';

test('renders available pets heading', () => {
  render(<App />);
  const heading = screen.getByText(/available pets/i);
  expect(heading).toBeInTheDocument();
});

import { render, screen } from '@testing-library/react';
import { App } from './App';

it('renders the SuetaVPN application root', () => {
  render(<App />);

  expect(screen.getByRole('heading', { name: 'SuetaVPN' })).toBeInTheDocument();
});

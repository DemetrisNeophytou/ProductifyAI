import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Landing from '../client/src/pages/Landing';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../client/src/lib/queryClient';
import { ThemeProvider } from '../client/src/components/ThemeProvider';

// Wrapper for providers
function TestWrapper({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}

describe('Landing Page UI', () => {
  it('should render the landing page with key headline', () => {
    render(
      <TestWrapper>
        <Landing />
      </TestWrapper>
    );
    
    // Check for key elements that should be present
    // The landing page should have some heading or title
    const headings = screen.getAllByRole('heading');
    expect(headings.length).toBeGreaterThan(0);
    
    // Should have buttons (CTA, navigation, etc)
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });

  it('should render without crashing', () => {
    const { container } = render(
      <TestWrapper>
        <Landing />
      </TestWrapper>
    );
    
    expect(container).toBeTruthy();
    expect(container.firstChild).toBeTruthy();
  });
});


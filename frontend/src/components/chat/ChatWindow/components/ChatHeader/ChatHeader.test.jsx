import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ChatHeader from './ChatHeader';
import { useAuth } from '../../../../../context/AuthContext';

// Mock out the global useAuth module context safely
vi.mock('../../../../../context/AuthContext', () => ({
  useAuth: vi.fn()
}));

describe('ChatHeader Component with Theme Integration', () => {
  const mockToggleTheme = vi.fn();
  
  const defaultProps = {
    title: 'John Doe',
    isOnline: true,
    isGroup: false,
    profileUsername: 'johndoe123',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Provide a standardized default mock payload baseline
    useAuth.mockReturnValue({
      theme: 'light',
      toggleTheme: mockToggleTheme
    });
  });

  it('renders the "Too Bright?" text label when workspace theme parameter is light', () => {
    render(
      <MemoryRouter>
        <ChatHeader {...defaultProps} />
      </MemoryRouter>
    );

    expect(screen.getByText('Too Bright?')).toBeInTheDocument();
    expect(screen.queryByText('Too Dark?')).not.toBeInTheDocument();
  });

  it('renders the "Too Dark?" text label when workspace theme parameter is dark', () => {
    useAuth.mockReturnValue({
      theme: 'dark',
      toggleTheme: mockToggleTheme
    });

    render(
      <MemoryRouter>
        <ChatHeader {...defaultProps} />
      </MemoryRouter>
    );

    expect(screen.getByText('Too Dark?')).toBeInTheDocument();
    expect(screen.queryByText('Too Bright?')).not.toBeInTheDocument();
  });

  it('fires toggleTheme callback parameter cleanly when clicking the header toggle button option', () => {
    render(
      <MemoryRouter>
        <ChatHeader {...defaultProps} />
      </MemoryRouter>
    );

    const toggleBtn = screen.getByRole('button', { name: /switch to dark mode/i });
    fireEvent.click(toggleBtn);

    expect(mockToggleTheme).toHaveBeenCalledTimes(1);
  });
});

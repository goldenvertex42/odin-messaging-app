import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import PendingRequests from './PendingRequests';

// Mock the react-router navigation hook to verify link dispatch mechanics
const mockNavigate = vi.fn();
vi.mock('react-router', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

// Mock CSS Module imports to prevent structural path failures
vi.mock('./PendingRequests.module.css', () => ({
  default: {
    requestsSection: 'mock-requests-section',
    empty: 'mock-empty',
    requestsList: 'mock-requests-list',
    requestCard: 'mock-request-card',
    requestAvatar: 'mock-request-avatar',
    requestMeta: 'mock-request-meta',
    reqName: 'mock-req-name',
    reqHandle: 'mock-req-handle',
    requestActions: 'mock-request-actions',
    btnAccept: 'mock-btn-accept',
    btnDecline: 'mock-btn-decline'
  }
}));

describe('PendingRequests Presentational & Event Dispatch Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const mockRequests = [
    {
      id: 'req_abc_123',
      sender: {
        id: 'user_thor',
        username: 'thor_god',
        displayName: 'Thor Odinson',
        avatarUrl: 'https://dicebear.com'
      }
    },
    {
      id: 'req_xyz_789',
      sender: {
        id: 'user_loki',
        username: 'loki_mischief',
        displayName: '', // Fallback fallback scenario
        avatarUrl: 'https://dicebear.com'
      }
    }
  ];

  test('displays an empty information screen when no friend requests are present', () => {
    render(
      <MemoryRouter>
        <PendingRequests requests={[]} onDecision={vi.fn()} />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Friend Requests');
    expect(screen.getByText('No pending requests.')).toBeInTheDocument();
  });

  test('renders multiple request cards accurately matching structural profile details', () => {
    render(
      <MemoryRouter>
        <PendingRequests requests={mockRequests} onDecision={vi.fn()} />
      </MemoryRouter>
    );

    // Card 1 Checks (Display Name check)
    expect(screen.getByText('Thor Odinson')).toBeInTheDocument();
    expect(screen.getByText('@thor_god')).toBeInTheDocument();

    // Card 2 Checks (Username fallback layout assertion check)
    expect(screen.getByText('loki_mischief')).toBeInTheDocument();
    expect(screen.getByText('@loki_mischief')).toBeInTheDocument();
    
    expect(screen.queryByText('No pending requests.')).not.toBeInTheDocument();
  });

  test('routes the application context to the sender profile page when clicking user metadata blocks', async () => {
    const user = userEvent.setup();
    
    render(
      <MemoryRouter>
        <PendingRequests requests={mockRequests} onDecision={vi.fn()} />
      </MemoryRouter>
    );

    const clickTarget = screen.getByText('Thor Odinson');
    await user.click(clickTarget);

    // Verify navigating to specific profile path segment rules
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(mockNavigate).toHaveBeenCalledWith('/profile/thor_god');
  });

  test('dispatches accept transaction payload parameters when clicking the validation action trigger', async () => {
    const handleDecision = vi.fn();
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <PendingRequests requests={mockRequests} onDecision={handleDecision} />
      </MemoryRouter>
    );

    const acceptButtons = screen.getAllByRole('button', { name: /accept/i });
    await user.click(acceptButtons[0]); // Fire on Thor's card

    expect(handleDecision).toHaveBeenCalledTimes(1);
    expect(handleDecision).toHaveBeenCalledWith(
      'req_abc_123',
      mockRequests[0].sender,
      'ACCEPTED'
    );
  });

  test('dispatches rejection cleanup payload parameters when clicking the decline interface layout element', async () => {
    const handleDecision = vi.fn();
    const user = userEvent.setup();

    render(
      <MemoryRouter>
        <PendingRequests requests={mockRequests} onDecision={handleDecision} />
      </MemoryRouter>
    );

    const declineButtons = screen.getAllByRole('button', { name: /decline/i });
    await user.click(declineButtons[1]); // Fire on Loki's card

    expect(handleDecision).toHaveBeenCalledTimes(1);
    expect(handleDecision).toHaveBeenCalledWith(
      'req_xyz_789',
      mockRequests[1].sender,
      'REJECTED'
    );
  });
});

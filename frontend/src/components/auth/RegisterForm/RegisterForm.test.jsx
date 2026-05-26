import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RegisterForm from './RegisterForm';

describe('RegisterForm Component - Presentational Unit Suite', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    mockOnSubmit.mockClear();
  });

  // 1. TEST FIELDS AND ACCESSIBILITY LAYOUT
  it('should render all form input fields with matching semantic labels', () => {
    render(<RegisterForm onSubmit={mockOnSubmit} loading={false} error="" />);

    expect(screen.getByLabelText(/email address/i)).toHaveValue('');
    expect(screen.getByLabelText(/username/i)).toHaveValue('');
    expect(screen.getByLabelText(/display name \(optional\)/i)).toHaveValue('');
    expect(screen.getByLabelText(/^password$/i)).toHaveValue('');
    expect(screen.getByLabelText(/confirm password/i)).toHaveValue('');
    
    const submitBtn = screen.getByRole('button', { name: /register/i });
    expect(submitBtn).toBeInTheDocument();
    expect(submitBtn).not.toBeDisabled();
  });

  // 2. TEST SUCCESSFUL DATA EMISSION ON SUBMIT
  it('should emit a sanitized registration data payload when password inputs match', async () => {
    const user = userEvent.setup();
    render(<RegisterForm onSubmit={mockOnSubmit} loading={false} error="" />);

    // Populate registration form
    await user.type(screen.getByLabelText(/email address/i), 'rookie@odin.com');
    await user.type(screen.getByLabelText(/username/i), 'odin_rookie');
    await user.type(screen.getByLabelText(/display name \(optional\)/i), 'Rookie Custom');
    await user.type(screen.getByLabelText(/^password$/i), 'pass1234');
    await user.type(screen.getByLabelText(/confirm password/i), 'pass1234');

    await user.click(screen.getByRole('button', { name: /register/i }));

    // Verifies that the internal logic drops confirmPassword from the sent payload
    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    expect(mockOnSubmit).toHaveBeenCalledWith({
      email: 'rookie@odin.com',
      username: 'odin_rookie',
      displayName: 'Rookie Custom',
      password: 'pass1234'
    });
  });

  // 3. TEST LOCAL CLIENT-SIDE PASSWORD MISMATCH GUARD
  it('should intercept submit attempts locally and throw an alert banner if password fields mismatch', async () => {
    const user = userEvent.setup();
    render(<RegisterForm onSubmit={mockOnSubmit} loading={false} error="" />);

    await user.type(screen.getByLabelText(/email address/i), 'mismatch@odin.com');
    await user.type(screen.getByLabelText(/username/i), 'bad_match');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/confirm password/i), 'password999'); // Mismatch string

    await user.click(screen.getByRole('button', { name: /register/i }));

    // Form should reject the submission and display its local error banner
    const alertBox = screen.getByRole('alert');
    expect(alertBox).toBeInTheDocument();
    expect(alertBox).toHaveTextContent(/passwords do not match\./i);
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  // 4. TEST LOADING STATE LOCKOUTS
  it('should disable form interaction and modify submission button copy during the loading state', () => {
    render(<RegisterForm onSubmit={mockOnSubmit} loading={true} error="" />);

    expect(screen.getByLabelText(/email address/i)).toBeDisabled();
    expect(screen.getByLabelText(/username/i)).toBeDisabled();
    expect(screen.getByLabelText(/display name \(optional\)/i)).toBeDisabled();
    expect(screen.getByLabelText(/^password$/i)).toBeDisabled();
    expect(screen.getByLabelText(/confirm password/i)).toBeDisabled();

    const loadingBtn = screen.getByRole('button', { name: /creating account\.\.\./i });
    expect(loadingBtn).toBeInTheDocument();
    expect(loadingBtn).toBeDisabled();
  });

  // 5. TEST DELEGATED SERVER ERROR DISPLAY
  it('should render external database error alert strings passed down from the parent container', () => {
    render(<RegisterForm onSubmit={mockOnSubmit} loading={false} error="Username link allocation already taken." />);

    const errorBanner = screen.getByRole('alert');
    expect(errorBanner).toBeInTheDocument();
    expect(errorBanner).toHaveTextContent(/username link allocation already taken\./i);
  });
});

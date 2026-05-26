import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LoginForm from './LoginForm';

describe('LoginForm Component - Presentational Unit Suite', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    vi.restoreAllMocks();
    mockOnSubmit.mockClear();
  });

  // 1. TEST FIELDS AND ACCESSIBILITY LAYOUT
  it('should render form fields with correct semantic labels and empty values', () => {
    render(<LoginForm onSubmit={mockOnSubmit} loading={false} error="" />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitBtn = screen.getByRole('button', { name: /sign in/i });

    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute('type', 'email');
    expect(emailInput).toHaveValue('');

    expect(passwordInput).toBeInTheDocument();
    expect(passwordInput).toHaveAttribute('type', 'password');
    expect(passwordInput).toHaveValue('');

    expect(submitBtn).toBeInTheDocument();
    expect(submitBtn).not.toBeDisabled();
  });

  // 2. TEST DATA EMISSION ON SUBMIT
  it('should capture field inputs and emit credentials on submit', async () => {
    const user = userEvent.setup();
    render(<LoginForm onSubmit={mockOnSubmit} loading={false} error="" />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitBtn = screen.getByRole('button', { name: /sign in/i });

    // Simulate typing
    await user.type(emailInput, 'warrior@odin.com');
    await user.type(passwordInput, 'valhallaPass');
    
    expect(emailInput).toHaveValue('warrior@odin.com');
    expect(passwordInput).toHaveValue('valhallaPass');

    // Trigger form submit
    await user.click(submitBtn);

    expect(mockOnSubmit).toHaveBeenCalledTimes(1);
    expect(mockOnSubmit).toHaveBeenCalledWith({
      email: 'warrior@odin.com',
      password: 'valhallaPass'
    });
  });

  // 3. TEST LOADING LOCKOUT STATE
  it('should disable inputs and update button text when loading flag is active', () => {
    render(<LoginForm onSubmit={mockOnSubmit} loading={true} error="" />);

    expect(screen.getByLabelText(/email address/i)).toBeDisabled();
    expect(screen.getByLabelText(/password/i)).toBeDisabled();
    
    const submitBtn = screen.getByRole('button', { name: /signing in\.\.\./i });
    expect(submitBtn).toBeInTheDocument();
    expect(submitBtn).toBeDisabled();
  });

  // 4. TEST RENDERING DELEGATED SERVER ERRORS
  it('should display the error banner and assign a semantic alert role when an error string is provided', () => {
    render(<LoginForm onSubmit={mockOnSubmit} loading={false} error="Account credentials mismatch." />);

    const errorBox = screen.getByRole('alert');
    expect(errorBox).toBeInTheDocument();
    expect(errorBox).toHaveTextContent(/account credentials mismatch\./i);
  });
});

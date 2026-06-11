import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import MessageInput from './MessageInput';

describe('MessageInput Component', () => {
  const mockOnSendMessage = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();
  });

  const assertClassContains = (element, classFragment) => {
    const className = element.className || '';
    const hasMatch = className.match ? className.match(classFragment) : className.includes(classFragment);
    expect(!!hasMatch).toBe(true);
  };

  it('renders input elements and send button with default placeholders', () => {
    render(<MessageInput onSendMessage={mockOnSendMessage} disabled={false} />);
    
    expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
    
    const submitButton = screen.getByText('Send');
    expect(submitButton).toBeDisabled();
  });

  it('updates text value on type and enables the send button wrapper', () => {
    render(<MessageInput onSendMessage={mockOnSendMessage} disabled={false} />);
    
    const textInput = screen.getByPlaceholderText('Type a message...');
    fireEvent.change(textInput, { target: { value: 'Hello server!' } });
    
    expect(textInput.value).toBe('Hello server!');
    
    const submitButton = screen.getByText('Send');
    expect(submitButton).not.toBeDisabled();
  });

  it('fires onSendMessage callback with typed content when submitted', async () => {
    render(<MessageInput onSendMessage={mockOnSendMessage} disabled={false} />);
    
    const textInput = screen.getByPlaceholderText('Type a message...');
    fireEvent.change(textInput, { target: { value: 'Valid text payload' } });
    
    const form = textInput.closest('form');
    fireEvent.submit(form);

    expect(mockOnSendMessage).toHaveBeenCalledTimes(1);
    expect(mockOnSendMessage).toHaveBeenCalledWith('Valid text payload', null);
    
    // Fixed: Await state reconciliation microtask loop execution
    await waitFor(() => {
      expect(textInput.value).toBe('');
    });
  });

  it('triggers file selection, updates the button state, and swaps text placeholder to caption mode', async () => {
    render(<MessageInput onSendMessage={mockOnSendMessage} disabled={false} />);
    
    const textInput = screen.getByPlaceholderText('Type a message...');
    const form = textInput.closest('form');
    const hiddenFileInput = form.querySelector('input[type="file"]');
    const attachmentFile = new File(['image-binary'], 'test-photo.jpg', { type: 'image/jpeg' });

    fireEvent.change(hiddenFileInput, { target: { files: [attachmentFile] } });

    expect(global.URL.createObjectURL).toHaveBeenCalledWith(attachmentFile);
    
    expect(screen.getByPlaceholderText('Add a caption...')).toBeInTheDocument();
    
    const attachButton = screen.getByTitle('Attach Image');
    assertClassContains(attachButton, 'hasFile');
  });

  it('renders a media image preview box and unstages the asset when clicking the remove icon button', () => {
    render(<MessageInput onSendMessage={mockOnSendMessage} disabled={false} />);
    
    const textInput = screen.getByPlaceholderText('Type a message...');
    const form = textInput.closest('form');
    const hiddenFileInput = form.querySelector('input[type="file"]');
    const attachmentFile = new File(['image-binary'], 'test-photo.jpg', { type: 'image/jpeg' });
    fireEvent.change(hiddenFileInput, { target: { files: [attachmentFile] } });

    const previewImage = screen.getByAltText('Staged image');
    expect(previewImage).toBeInTheDocument();
    expect(previewImage).toHaveAttribute('src', 'blob:mock-url');

    const removeButton = screen.getByLabelText('Remove image attachment');
    fireEvent.click(removeButton);

    expect(global.URL.revokeObjectURL).toHaveBeenCalledWith('blob:mock-url');
    expect(screen.queryByAltText('Staged image')).not.toBeInTheDocument();
    expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
  });

  it('submits correctly when an image payload is attached with no message text caption content', async () => {
    render(<MessageInput onSendMessage={mockOnSendMessage} disabled={false} />);
    
    const textInput = screen.getByPlaceholderText('Type a message...');
    const form = textInput.closest('form');
    const hiddenFileInput = form.querySelector('input[type="file"]');
    const attachmentFile = new File(['image-binary'], 'test-photo.jpg', { type: 'image/jpeg' });
    
    fireEvent.change(hiddenFileInput, { target: { files: [attachmentFile] } });

    fireEvent.submit(form);

    expect(mockOnSendMessage).toHaveBeenCalledTimes(1);
    expect(mockOnSendMessage).toHaveBeenCalledWith('', attachmentFile);
    
    // Fixed: Await asynchronous post-submit component layout resets
    await waitFor(() => {
      expect(screen.getByPlaceholderText('Type a message...')).toBeInTheDocument();
    });
  });

  it('blocks form submissions, text inputs, and file button clicks completely when disabled property is active', () => {
    render(<MessageInput onSendMessage={mockOnSendMessage} disabled={true} />);
    
    const textInput = screen.getByPlaceholderText('Type a message...');
    const attachButton = screen.getByTitle('Attach Image');
    const sendButton = screen.getByText('...');

    expect(textInput).toBeDisabled();
    expect(attachButton).toBeDisabled();
    expect(sendButton).toBeDisabled();

    const form = textInput.closest('form');
    fireEvent.submit(form);

    expect(mockOnSendMessage).not.toHaveBeenCalled();
  });
});

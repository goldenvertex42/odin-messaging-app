import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import ImageModal from './ImageModal';

describe('ImageModal Component', () => {
  const mockImageUrl = 'https://example.com';
  const mockAltText = 'Enlarged media preview';

  it('should render null if no imageUrl property is supplied', () => {
    const { container } = render(<ImageModal imageUrl="" onClose={vi.fn()} />);
    expect(container.firstChild).toBeNull();
  });

  it('should render the image element and close button when active', () => {
    render(<ImageModal imageUrl={mockImageUrl} onClose={vi.fn()} />);
    
    const imageElement = screen.getByAltText(mockAltText);
    expect(imageElement).toBeInTheDocument();
    expect(imageElement).toHaveAttribute('src', mockImageUrl);
    expect(screen.getByLabelText('Close image viewer')).toBeInTheDocument();
  });

  it('should trigger the onClose callback when clicking the cross button', () => {
    const mockOnClose = vi.fn();
    render(<ImageModal imageUrl={mockImageUrl} onClose={mockOnClose} />);
    
    const closeBtn = screen.getByLabelText('Close image viewer');
    fireEvent.click(closeBtn);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should trigger the onClose callback when clicking the overlay backdrop', () => {
    const mockOnClose = vi.fn();
    render(<ImageModal imageUrl={mockImageUrl} onClose={mockOnClose} />);
    
    // The dialog role maps to our root outer overlay wrapper element
    const overlayElement = screen.getByRole('dialog');
    fireEvent.click(overlayElement);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('should NOT trigger onClose when clicking directly on the image element due to event propagation clamping', () => {
    const mockOnClose = vi.fn();
    render(<ImageModal imageUrl={mockImageUrl} onClose={mockOnClose} />);
    
    const imageElement = screen.getByAltText(mockAltText);
    fireEvent.click(imageElement);
    
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('should trigger the onClose callback when the Escape keyboard key is pressed', () => {
    const mockOnClose = vi.fn();
    render(<ImageModal imageUrl={mockImageUrl} onClose={mockOnClose} />);
    
    fireEvent.keyDown(window, { key: 'Escape', code: 'Escape' });
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});

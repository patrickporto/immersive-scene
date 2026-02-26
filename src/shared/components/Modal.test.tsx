// @vitest-environment jsdom
import React from 'react';

import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';

vi.mock('framer-motion', () => {
  return {
    motion: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any, react/display-name
      div: React.forwardRef(({ children, ...props }: any, ref) => (
        <div ref={ref} {...props}>
          {children}
        </div>
      )),
    },
    AnimatePresence: ({ children }: any) => <>{children}</>,
  };
});

import { Modal } from './Modal';

describe('Modal component', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders children when isOpen is true', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <div data-testid="modal-content">Content</div>
      </Modal>
    );
    expect(screen.getByTestId('modal-content')).toBeDefined();
    expect(screen.getByText('Test Modal')).toBeDefined();
  });

  it('does not render when isOpen is false', () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="Test Modal">
        <div data-testid="modal-content">Content</div>
      </Modal>
    );
    expect(screen.queryByTestId('modal-content')).toBeNull();
  });

  it('calls onClose when close button is clicked', () => {
    const handleClose = vi.fn();
    const { container } = render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <div>Content</div>
      </Modal>
    );
    // Find the close button by its inner lucide-react x icon
    const closeButton = container.querySelector('button');
    if (closeButton) {
      fireEvent.click(closeButton);
    }
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when Escape key is pressed', () => {
    const handleClose = vi.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <div>Content</div>
      </Modal>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    const handleClose = vi.fn();
    const { container } = render(
      <Modal isOpen={true} onClose={handleClose} title="Test Modal">
        <div>Content</div>
      </Modal>
    );
    // the backdrop is the first generic div child that is absolute inset-0
    const backdrop = container.querySelector('.absolute.inset-0');
    if (backdrop) {
      fireEvent.click(backdrop);
    }
    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});

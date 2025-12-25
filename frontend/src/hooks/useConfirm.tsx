import { useState, useCallback, useRef } from 'react';
import ConfirmDialog from '../components/ConfirmDialog';

interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export const useConfirm = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({ message: '' });
  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((confirmOptions: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      // Store resolve function in ref before setting state
      resolveRef.current = resolve;
      setOptions(confirmOptions);
      setIsOpen(true);
    });
  }, []);

  const handleCancel = useCallback(() => {
    const currentResolve = resolveRef.current;
    setIsOpen(false);
    // Clear ref first to prevent double calls
    resolveRef.current = null;
    // Then call resolve if it exists
    if (currentResolve) {
      currentResolve(false);
    }
  }, []);

  const handleConfirm = useCallback(() => {
    const currentResolve = resolveRef.current;
    setIsOpen(false);
    // Clear ref first to prevent double calls
    resolveRef.current = null;
    // Then call resolve if it exists
    if (currentResolve) {
      currentResolve(true);
    }
  }, []);

  const ConfirmDialogComponent = (
    <ConfirmDialog
      isOpen={isOpen}
      title={options.title || 'Xác nhận'}
      message={options.message}
      confirmText={options.confirmText}
      cancelText={options.cancelText}
      type={options.type || 'warning'}
      onConfirm={handleConfirm}
      onCancel={handleCancel}
    />
  );

  return { confirm, ConfirmDialog: ConfirmDialogComponent };
};


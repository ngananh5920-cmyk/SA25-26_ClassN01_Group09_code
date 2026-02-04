import React, { useState } from 'react';
import { X } from 'lucide-react';

interface CommentModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  placeholder?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: (comment: string) => void;
  onCancel: () => void;
}

const CommentModal: React.FC<CommentModalProps> = ({
  isOpen,
  title,
  message,
  placeholder = 'Enter reason...',
  confirmText = 'Confirm',
  cancelText = 'Hủy',
  onConfirm,
  onCancel,
}) => {
  const [comment, setComment] = useState('');

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(comment);
    setComment('');
  };

  const handleCancel = () => {
    setComment('');
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 fade-in">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 border-2 border-yellow-200 slide-up">
        <div className="bg-yellow-50 px-6 py-4 border-b border-yellow-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>
        
        <div className="px-6 py-4">
          <p className="text-gray-700 mb-4">{message}</p>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={placeholder}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent outline-none resize-none"
            rows={4}
          />
        </div>
        
        <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-end gap-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 text-white bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors font-medium"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommentModal;







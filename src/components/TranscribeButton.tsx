import React from 'react';

interface TranscribeButtonProps {
  isLoading?: boolean;
  onClick: () => void;
}

export const TranscribeButton: React.FC<TranscribeButtonProps> = ({
  isLoading = false,
  onClick,
}) => {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className="flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium bg-white hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-200 text-gray-800 transition-colors"
      title="Transcrever mensagem de áudio"
    >
      {isLoading ? (
        <>
          <span className="inline-block w-4 h-4 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
          Transcrevendo...
        </>
      ) : (
        <>
          <span>📝</span>
          Transcrever
        </>
      )}
    </button>
  );
};

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
      className="ta-btn"
      title="Transcrever mensagem de áudio"
    >
      {isLoading ? (
        <>
          <span className="ta-spinner" />
          Transcrevendo...
        </>
      ) : (
        <>
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm5-3a1 1 0 0 1 2 0 7 7 0 0 1-6 6.93V21a1 1 0 1 1-2 0v-3.07A7 7 0 0 1 5 11a1 1 0 1 1 2 0 5 5 0 0 0 10 0Z" />
          </svg>
          Transcrever
        </>
      )}
    </button>
  );
};

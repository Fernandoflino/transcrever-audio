import React from 'react';

interface TranscriptBubbleProps {
  text: string;
  error?: string;
  isLoading?: boolean;
}

export const TranscriptBubble: React.FC<TranscriptBubbleProps> = ({
  text,
  error,
  isLoading,
}) => {
  if (isLoading) {
    return (
      <div className="px-3 py-2 rounded bg-gray-100 text-gray-600 text-sm italic">
        Processando transcrição...
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-3 py-2 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
        ❌ Erro: {error}
      </div>
    );
  }

  if (!text) {
    return null;
  }

  return (
    <div className="px-3 py-2 rounded bg-blue-50 border-l-2 border-blue-400 text-gray-800 text-sm whitespace-pre-wrap break-words">
      {text}
    </div>
  );
};

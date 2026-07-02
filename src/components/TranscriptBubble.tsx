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
      <div className="ta-card ta-loading">
        <span className="ta-spinner" />
        Transcrevendo áudio...
      </div>
    );
  }

  if (error) {
    return <div className="ta-card ta-error">{error}</div>;
  }

  if (!text) {
    return null;
  }

  return <div className="ta-card">{text}</div>;
};

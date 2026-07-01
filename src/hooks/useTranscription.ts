import { useState } from 'react';
import { logger } from '@utils/logger';

interface TranscriptionState {
  status: 'idle' | 'loading' | 'success' | 'error';
  text: string;
  error: string | null;
  fromCache: boolean;
}

export function useTranscription() {
  const [state, setState] = useState<TranscriptionState>({
    status: 'idle',
    text: '',
    error: null,
    fromCache: false,
  });

  const transcribe = async (
    messageId: string,
    audioBase64: string,
    audioFormat: string
  ) => {
    setState({ status: 'loading', text: '', error: null, fromCache: false });

    try {
      logger.log(`Requesting transcription for message ${messageId.slice(0, 16)}...`);

      const response = await chrome.runtime.sendMessage({
        type: 'TRANSCRIBE_AUDIO',
        messageId,
        audioBase64,
        audioFormat,
      });

      if (response.ok) {
        setState({
          status: 'success',
          text: response.text,
          error: null,
          fromCache: response.fromCache,
        });
        logger.log(`Transcription successful (fromCache: ${response.fromCache})`);
      } else {
        const errorMsg = response.errorMessage || 'Unknown error';
        setState({
          status: 'error',
          text: '',
          error: errorMsg,
          fromCache: false,
        });
        logger.warn(`Transcription failed: ${response.errorCode} - ${errorMsg}`);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      setState({
        status: 'error',
        text: '',
        error: errorMsg,
        fromCache: false,
      });
      logger.error('Error sending transcription request:', error);
    }
  };

  const reset = () => {
    setState({ status: 'idle', text: '', error: null, fromCache: false });
  };

  return { ...state, transcribe, reset };
}

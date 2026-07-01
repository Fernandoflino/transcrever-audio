import React, { useEffect, useRef } from 'react';
import ReactDOM from 'react-dom';

interface ShadowRootProps {
  hostElement: HTMLElement;
  children: React.ReactNode;
  cssText?: string;
}

export const ShadowRoot: React.FC<ShadowRootProps> = ({
  hostElement,
  children,
  cssText,
}) => {
  const shadowRootRef = useRef<ShadowRoot | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create shadow root
    if (!hostElement.shadowRoot) {
      shadowRootRef.current = hostElement.attachShadow({ mode: 'open' });
    } else {
      shadowRootRef.current = hostElement.shadowRoot;
    }

    const shadowRoot = shadowRootRef.current!;

    // Create container for React
    if (!containerRef.current) {
      containerRef.current = document.createElement('div');
      shadowRoot.appendChild(containerRef.current);
    }

    // Inject Tailwind CSS if not already done
    if (!shadowRoot.querySelector('style[data-transcrever-audio-tailwind]')) {
      const style = document.createElement('style');
      style.setAttribute('data-transcrever-audio-tailwind', '');

      // Tailwind CSS with preflight disabled (to avoid affecting host document)
      // We use a minimal setup that targets only our elements
      const tailwindCSS = `
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        :host {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
            'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
            sans-serif;
          font-size: 14px;
          line-height: 1.5;
        }

        button {
          font-family: inherit;
          cursor: pointer;
          border: none;
          background: none;
          padding: 0;
        }

        button:disabled {
          cursor: not-allowed;
        }

        /* Tailwind utility classes */
        .flex { display: flex; }
        .items-center { align-items: center; }
        .gap-2 { gap: 0.5rem; }
        .px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
        .py-1\\.5 { padding-top: 0.375rem; padding-bottom: 0.375rem; }
        .py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
        .rounded { border-radius: 0.25rem; }
        .text-sm { font-size: 0.875rem; }
        .font-medium { font-weight: 500; }
        .bg-white { background-color: white; }
        .bg-gray-100 { background-color: rgb(243, 244, 246); }
        .bg-gray-200 { background-color: rgb(229, 231, 235); }
        .bg-gray-300 { background-color: rgb(209, 213, 219); }
        .bg-gray-800 { background-color: rgb(31, 41, 55); }
        .bg-blue-50 { background-color: rgb(239, 246, 255); }
        .bg-red-50 { background-color: rgb(254, 242, 242); }
        .hover\\:bg-gray-100:hover { background-color: rgb(243, 244, 246); }
        .disabled\\:opacity-50:disabled { opacity: 0.5; }
        .disabled\\:cursor-not-allowed:disabled { cursor: not-allowed; }
        .border { border-width: 1px; }
        .border-gray-200 { border-color: rgb(229, 231, 235); }
        .border-l-2 { border-left-width: 2px; }
        .border-blue-400 { border-color: rgb(96, 165, 250); }
        .border-red-200 { border-color: rgb(254, 202, 202); }
        .text-gray-800 { color: rgb(31, 41, 55); }
        .text-gray-600 { color: rgb(75, 85, 99); }
        .text-red-700 { color: rgb(185, 28, 28); }
        .italic { font-style: italic; }
        .transition-colors { transition-property: background-color, border-color, color; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
        .whitespace-pre-wrap { white-space: pre-wrap; }
        .break-words { word-break: break-word; }
        .inline-block { display: inline-block; }
        .w-4 { width: 1rem; }
        .h-4 { height: 1rem; }
        .border-2 { border-width: 2px; }
        .border-gray-300 { border-color: rgb(209, 213, 219); }
        .border-t-gray-800 { border-top-color: rgb(31, 41, 55); }
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        ${cssText || ''}
      `;

      style.textContent = tailwindCSS;
      shadowRoot.appendChild(style);
    }

    return () => {
      // Cleanup is handled by React
    };
  }, [hostElement, cssText]);

  if (!containerRef.current) {
    return null;
  }

  return ReactDOM.createPortal(children, containerRef.current);
};

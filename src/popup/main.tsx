import React from 'react';
import ReactDOM from 'react-dom/client';
import Popup from './Popup';
import './styles/popup.css';

const root = ReactDOM.createRoot(
  document.getElementById('root') || document.createElement('div')
);
root.render(<Popup />);

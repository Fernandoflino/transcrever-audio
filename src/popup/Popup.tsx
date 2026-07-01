import React from 'react';

const Popup: React.FC = () => {
  return (
    <div className="w-96 p-6 bg-white">
      <h1 className="text-2xl font-bold text-whatsapp-green mb-4">
        Transcrever Áudio
      </h1>
      <p className="text-gray-600 text-sm">
        Configure sua chave de API do OpenRouter para começar.
      </p>
      {/* Fields will be added in later phases */}
    </div>
  );
};

export default Popup;

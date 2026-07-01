# Transcrever Áudio — WhatsApp Web Extension

Uma extensão de navegador (Chrome/Edge, Manifest V3) que transcreve mensagens de áudio no WhatsApp Web para texto, integrando-se perfeitamente à interface nativa da aplicação.

## Stack

- **Manifest V3** — moderna, segura, pronta para Chrome Web Store/Edge Add-ons
- **TypeScript** — tipagem forte, sem `any`
- **React** — UI do popup de configurações
- **Vite** — build rápido com `@crxjs/vite-plugin`
- **TailwindCSS** — estilos isolados por Shadow DOM
- **OpenRouter API** — transcrição via modelos de IA configuráveis
- **IndexedDB** — cache de transcrições para nunca re-transcrever o mesmo áudio

## Arquitetura

### Isolamento de Responsabilidades

- **`src/adapter/`** — lógica exclusivamente específica do WhatsApp (seletores DOM, detecção de mensagens)
- **`src/audio/`** — extração de áudio via múltiplas estratégias (DOM blob, ponte interna do WhatsApp)
- **`src/background/`** — service worker: orquestração, cache, API calls
- **`src/content/`** — content script (mundo isolado): integração de UI, ponte para MAIN world
- **`src/mainWorldBridge/`** — acesso aos módulos webpack internos do WhatsApp (MAIN world)
- **`src/api/`** — cliente OpenRouter typesafe com erros categorizados
- **`src/storage/`** — IndexedDB própria da extensão (cache de transcrições)
- **`src/services/`** — lógica de domínio (hash, settings, orquestração de transcrição)

### Flow

1. **Detecção**: `WhatsAppAdapter` + `MutationObserver` detecta novas notas de voz na tela
2. **UI**: `TranscribeButton` injetado abaixo de cada bolha de áudio (Shadow DOM)
3. **Extração**: `AudioExtractor` tenta recuperar o Blob via múltiplas estratégias
4. **Transcrição**: Content script envia áudio (base64) para o background via `chrome.runtime.sendMessage`
5. **Background**: hash SHA-256 → cache (hit) ou OpenRouter API (miss)
6. **Resultado**: texto renderizado diretamente abaixo da mensagem, estilizado como elemento nativo

## Setup & Desenvolvimento

```bash
# Instalar dependências
npm install

# Build para desenvolvimento/teste
npm run build

# Build + watch (se usar Vite dev)
npm run dev

# Testes unitários
npm test

# Linting
npm run lint
```

## Carregamento na Extensão (Unpacked)

1. Abra `chrome://extensions` (Chrome) ou `edge://extensions` (Edge)
2. Ative "Modo de desenvolvedor"
3. Clique "Carregar extensão sem compactação"
4. Selecione a pasta `dist/` deste projeto

## Configuração

1. Abra web.whatsapp.com
2. Clique no ícone da extensão no canto superior direito
3. Insira sua chave de API do OpenRouter
4. Escolha o modelo de transcrição (padrão: `openai/gpt-4o-mini-transcribe`)
5. Opcionalmente, escolha o idioma da transcrição

## Features Implementadas (Marco 1-2)

- ✅ Scaffold: Vite + crxjs, TypeScript strict, ESLint, Vitest
- ✅ Storage: IndexedDB (db.ts, TranscriptionCacheService)
- ✅ Services: SHA-256 hashing, SettingsService
- ✅ API: OpenRouterService com erros tipados
- ✅ Background: message router, transcribe handler
- ✅ AudioExtractor: arquitetura de estratégias (domBlob, internalBridge)
- ✅ WhatsAppAdapter: seletores resilientes, MutationObserver (stub)
- ✅ Testes: hashService, TranscriptionCacheService, OpenRouterService

## Próximos Passos (Marcos 3+)

1. Melhorar `WhatsAppAdapter` contra a UI real do WhatsApp Web
2. Implementar `mainWorldBridgeClient` completo (locating Store, decryption)
3. UI: `TranscribeButton`, `TranscriptBubble`, `ShadowRoot`, CSS
4. Popup React: campos de configuração (API Key, Model, Language)
5. Testes e2e contra WhatsApp Web real
6. Polimento: error states, loader animations, accessibility

## Riscos & Mitigação

### Seletores frágeis
- **Risco**: WhatsApp muda classe CSS/atributo
- **Mitigação**: Centralizados em `adapter/selectors.ts`, preferir `data-*`, `aria-label`, `role`

### Ponte interna quebra
- **Risco**: Formato interno dos módulos webpack muda
- **Mitigação**: Duck-typing (nunca IDs fixos), cache em memória, fallback para outra estratégia

### Expor API key
- **Risco**: API key vaza para a página do WhatsApp
- **Mitigação**: Só existe no `background/`, nunca passa para content script ou MAIN world

### Leakage de CSS
- **Risco**: Tailwind contamina WhatsApp ou vice-versa
- **Mitigação**: Shadow DOM para UI injetada, `corePlugins.preflight: false` no Tailwind

## Documentação Técnica

- **Bridge Message Protocol** (`src/content/mainWorldBridgeClient.ts`): postMessage schema
- **Audio Extraction Strategies** (`src/audio/strategies/`): cada estratégia é independente, plugável
- **Cache Schema** (`src/storage/types.ts`): hash → text mapping, nunca decrypt no IndexedDB
- **OpenRouter Contract** (`src/api/types.ts`): request/response JSON shapes

## Licença

Propriedade do usuário (development only).

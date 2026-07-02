import React from 'react';
import { SettingsService } from '@services/SettingsService';
import { DEFAULT_SETTINGS, type ExtensionSettings } from '@storage/types';

const settingsService = new SettingsService();

const MODEL_OPTIONS = [
  { value: 'openai/gpt-4o-mini-transcribe', label: 'GPT-4o mini transcribe (rápido/barato)' },
  { value: 'openai/gpt-4o-transcribe', label: 'GPT-4o transcribe (mais preciso)' },
  { value: 'openai/whisper-1', label: 'Whisper v1' },
];

const LANGUAGE_OPTIONS = [
  { value: '', label: 'Detectar automaticamente' },
  { value: 'pt', label: 'Português' },
  { value: 'en', label: 'Inglês' },
  { value: 'es', label: 'Espanhol' },
];

const GREEN = '#00a884';

const styles: Record<string, React.CSSProperties> = {
  wrap: {
    width: 340,
    padding: 0,
    background: '#fff',
    fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif",
    color: '#111b21',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '16px 18px',
    background: GREEN,
    color: '#fff',
  },
  headerTitle: { fontSize: 17, fontWeight: 700, margin: 0 },
  headerSub: { fontSize: 12, opacity: 0.9, margin: 0 },
  body: { padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 12.5, fontWeight: 600, color: '#41525d' },
  input: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '9px 11px',
    fontSize: 13.5,
    border: '1px solid #d1d7db',
    borderRadius: 8,
    outline: 'none',
    fontFamily: 'inherit',
    background: '#fff',
    color: '#111b21',
  },
  hint: { fontSize: 11, color: '#8696a0' },
  link: { color: GREEN, textDecoration: 'none', fontWeight: 600 },
  saveBtn: {
    marginTop: 4,
    padding: '10px 14px',
    border: 'none',
    borderRadius: 8,
    background: GREEN,
    color: '#fff',
    fontSize: 14,
    fontWeight: 700,
    cursor: 'pointer',
    fontFamily: 'inherit',
  },
  status: { fontSize: 12.5, fontWeight: 600, textAlign: 'center', minHeight: 16 },
};

const Popup: React.FC = () => {
  const [settings, setSettings] = React.useState<ExtensionSettings>(DEFAULT_SETTINGS);
  const [showKey, setShowKey] = React.useState(false);
  const [status, setStatus] = React.useState<{ msg: string; ok: boolean } | null>(null);
  const [loaded, setLoaded] = React.useState(false);

  React.useEffect(() => {
    settingsService.getSettings().then((s) => {
      setSettings(s);
      setLoaded(true);
    });
  }, []);

  const update = <K extends keyof ExtensionSettings>(key: K, value: ExtensionSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setStatus(null);
  };

  const handleSave = async () => {
    await settingsService.updateSettings({
      apiKey: settings.apiKey.trim(),
      model: settings.model,
      language: settings.language || undefined,
    });
    setStatus({ msg: '✓ Configurações salvas!', ok: true });
    setTimeout(() => setStatus(null), 2500);
  };

  if (!loaded) {
    return <div style={{ ...styles.wrap, padding: 24, textAlign: 'center' }}>Carregando…</div>;
  }

  return (
    <div style={styles.wrap}>
      <div style={styles.header}>
        <span style={{ fontSize: 24 }}>🎤</span>
        <div>
          <h1 style={styles.headerTitle}>Transcrever Áudio</h1>
          <p style={styles.headerSub}>WhatsApp Web · OpenRouter</p>
        </div>
      </div>

      <div style={styles.body}>
        <div style={styles.field}>
          <label style={styles.label}>Chave da API (OpenRouter)</label>
          <div style={{ position: 'relative' }}>
            <input
              type={showKey ? 'text' : 'password'}
              style={{ ...styles.input, paddingRight: 54 }}
              placeholder="sk-or-v1-..."
              value={settings.apiKey}
              onChange={(e) => update('apiKey', e.target.value)}
              autoComplete="off"
              spellCheck={false}
            />
            <button
              type="button"
              onClick={() => setShowKey((v) => !v)}
              style={{
                position: 'absolute',
                right: 8,
                top: '50%',
                transform: 'translateY(-50%)',
                border: 'none',
                background: 'none',
                color: GREEN,
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {showKey ? 'Ocultar' : 'Ver'}
            </button>
          </div>
          <span style={styles.hint}>
            Pegue sua chave em{' '}
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noreferrer"
              style={styles.link}
            >
              openrouter.ai/keys
            </a>
          </span>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Modelo de transcrição</label>
          <select
            style={styles.input}
            value={settings.model}
            onChange={(e) => update('model', e.target.value)}
          >
            {MODEL_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Idioma</label>
          <select
            style={styles.input}
            value={settings.language ?? ''}
            onChange={(e) => update('language', e.target.value || undefined)}
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <button style={styles.saveBtn} onClick={handleSave}>
          Salvar
        </button>

        <div style={{ ...styles.status, color: status?.ok ? GREEN : '#b02a24' }}>
          {status?.msg ?? ''}
        </div>
      </div>
    </div>
  );
};

export default Popup;

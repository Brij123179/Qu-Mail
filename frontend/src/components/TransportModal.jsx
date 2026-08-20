import React, { useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../services/api';

export default function TransportModal({ onClose, currentConfig, onSaved }) {
  const [mode, setMode] = useState(currentConfig?.mode || 'local_storage');
  const [smtpHost, setSmtpHost] = useState(currentConfig?.smtp_host || 'smtp.gmail.com');
  const [smtpPort, setSmtpPort] = useState(currentConfig?.smtp_port || 587);
  const [smtpUser, setSmtpUser] = useState(currentConfig?.smtp_user || '');
  const [smtpPass, setSmtpPass] = useState('');

  const handleSave = async () => {
    try {
      await api.updateTransportConfig({
        mode,
        smtp_host: smtpHost,
        smtp_port: parseInt(smtpPort),
        smtp_user: smtpUser || null,
        smtp_password: smtpPass || null,
      });
      alert('Transport settings updated successfully!');
      onSaved();
      onClose();
    } catch (err) {
      alert(`Error saving config: ${err.message}`);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)', display: 'grid', placeItems: 'center', zIndex: 999 }}>
      <div style={{ background: '#0b1329', border: '1px solid var(--cyan)', borderRadius: '16px', padding: '28px', width: '90%', maxWidth: '600px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(0,240,255,0.2)', paddingBottom: '10px' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', color: 'var(--cyan)' }}>⚙️ Email Transport Configuration</h3>
          <X cursor="pointer" onClick={onClose} color="var(--red)" />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Transport Mode</label>
          <select value={mode} onChange={(e) => setMode(e.target.value)} style={{ background: 'rgba(5, 10, 20, 0.7)', border: '1px solid rgba(255, 255, 255, 0.12)', borderRadius: '8px', padding: '12px', color: '#fff' }}>
            <option value="local_storage">Local Transport Database (Simulated Mailbox)</option>
            <option value="real_smtp_imap">Real Internet SMTP Server (Gmail / Outlook)</option>
          </select>
        </div>

        {mode === 'real_smtp_imap' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '10px', color: 'var(--text-muted)' }}>SMTP Host</label>
              <input type="text" value={smtpHost} onChange={(e) => setSmtpHost(e.target.value)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '10px', color: 'var(--text-muted)' }}>SMTP Port</label>
              <input type="number" value={smtpPort} onChange={(e) => setSmtpPort(e.target.value)} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '10px', color: 'var(--text-muted)' }}>SMTP Username / Email</label>
              <input type="text" value={smtpUser} onChange={(e) => setSmtpUser(e.target.value)} placeholder="your-email@gmail.com" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '10px', color: 'var(--text-muted)' }}>SMTP App Password</label>
              <input type="password" value={smtpPass} onChange={(e) => setSmtpPass(e.target.value)} placeholder="App Password" />
            </div>
          </div>
        )}

        <button onClick={handleSave} style={{
          background: 'linear-gradient(135deg, var(--cyan), #00a8ff)', color: '#000',
          fontFamily: 'var(--font-heading)', fontWeight: '700', fontSize: '13px',
          padding: '12px', border: 'none', borderRadius: '8px', cursor: 'pointer', marginTop: '10px'
        }}>
          Save Transport Settings
        </button>
      </div>
    </div>
  );
}

import React from 'react';
import { Send, Lock } from 'lucide-react';

export default function EmailComposer({
  sender, setSender,
  recipient, setRecipient,
  subject, setSubject,
  body, setBody,
  securityLevel, setSecurityLevel,
  attachments = [], setAttachments,
  onSend, onCancel
}) {
  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const b64Data = event.target.result.split(',')[1];
        if (setAttachments) {
          setAttachments((prev) => [
            ...(prev || []),
            { filename: file.name, content_type: file.type || 'application/octet-stream', data_b64: b64Data }
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeAttachment = (index) => {
    if (setAttachments) {
      setAttachments((prev) => prev.filter((_, i) => i !== index));
    }
  };

  return (
    <form onSubmit={onSend} style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%' }}>
      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: '700', color: '#0f172a', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px' }}>
        Compose Quantum Encrypted Email
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Sender</label>
          <input type="text" value={sender} onChange={(e) => setSender(e.target.value)} required />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>
            Recipient <span style={{ fontSize: '9px', color: '#3b82f6', textTransform: 'none' }}>(Commas for multi-send)</span>
          </label>
          <input type="text" value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="bob@qumail.sec, charlie@qumail.sec" required />
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Subject</label>
        <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} required />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Select Security Level</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
          {[
            { lvl: 1, name: 'L1: TLS Only', desc: 'Standard Email' },
            { lvl: 2, name: 'L2: Quantum AES', desc: 'AES-256 GCM' },
            { lvl: 3, name: 'L3: Quantum OTP', desc: 'Unbreakable Vernam' },
            { lvl: 4, name: 'L4: PQC Hybrid', desc: 'Kyber Post-Quantum' },
          ].map((item) => (
            <div key={item.lvl} onClick={() => setSecurityLevel(item.lvl)} style={{
              background: securityLevel === item.lvl ? '#eff6ff' : '#ffffff',
              border: securityLevel === item.lvl ? '2px solid #2563eb' : '1px solid #cbd5e1',
              borderRadius: '8px', padding: '10px 4px', textAlign: 'center', cursor: 'pointer',
              boxShadow: securityLevel === item.lvl ? '0 2px 8px rgba(37, 99, 235, 0.15)' : 'none'
            }}>
              <div style={{ fontFamily: 'var(--font-heading)', fontSize: '12px', fontWeight: '700', color: securityLevel === item.lvl ? '#1e40af' : '#0f172a' }}>{item.name}</div>
              <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
        <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>Message Body</label>
        <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={5} style={{ flex: 1 }} required />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '11px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase' }}>🔒 Encrypted File Attachments</label>
        <input type="file" onChange={handleFileChange} multiple style={{ fontSize: '11px', padding: '4px' }} />
        {attachments && attachments.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
            {attachments.map((att, idx) => (
              <span key={idx} style={{ background: '#e0f2fe', color: '#0369a1', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                📎 {att.filename}
                <button type="button" onClick={() => removeAttachment(idx)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', fontWeight: 'bold' }}>×</button>
              </span>
            ))}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '6px' }}>
        <button type="submit" style={{
          background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', color: '#ffffff',
          fontFamily: 'var(--font-heading)', fontWeight: '700', fontSize: '13px',
          padding: '12px 24px', border: 'none', borderRadius: '8px', cursor: 'pointer', flex: 1,
          display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px'
        }}>
          <Lock size={16} /> Encrypt & Send Email
        </button>
        <button type="button" onClick={onCancel} style={{
          background: '#f8fafc', border: '1px solid #cbd5e1', color: '#475569',
          padding: '12px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: '600'
        }}>
          Cancel
        </button>
      </div>
    </form>
  );
}

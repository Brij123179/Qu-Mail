import React from 'react';
import { X, Eye } from 'lucide-react';

export default function MimeInspectorModal({ inspectMimeData, onClose }) {
  if (!inspectMimeData) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(6px)', display: 'grid', placeItems: 'center', zIndex: 999 }}>
      <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '28px', width: '90%', maxWidth: '680px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Eye color="#2563eb" size={20} /> Raw MIME Encrypted Email Inspector
          </h3>
          <X cursor="pointer" onClick={onClose} color="#64748b" />
        </div>

        <div style={{ fontSize: '12px', color: '#64748b' }}>
          Notice that secret key material is absent from MIME headers and body. Only <code>X-QuMail-Key-Id</code> and <code>X-QuMail-Level</code> ride the transport channel.
        </div>

        <div style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '16px', fontFamily: 'var(--font-code)', fontSize: '11px', color: '#0f172a', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {`MIME-Version: 1.0\nContent-Type: ${inspectMimeData.headers['Content-Type'] || 'application/qumail-enc'}\nFrom: ${inspectMimeData.sender}\nTo: ${inspectMimeData.recipient}\nSubject: ${inspectMimeData.subject}\nDate: ${inspectMimeData.timestamp}\nX-QuMail-Level: ${inspectMimeData.security_level}\n${inspectMimeData.key_id ? `X-QuMail-Key-Id: ${inspectMimeData.key_id}\n` : ''}${inspectMimeData.iv_b64 ? `X-QuMail-IV: ${inspectMimeData.iv_b64}\n` : ''}\n--- ENCRYPTED PAYLOAD (BASE64) ---\n${inspectMimeData.body_b64}`}
        </div>
      </div>
    </div>
  );
}

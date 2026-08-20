import React from 'react';
import { Eye, Flame, CheckCircle, ShieldAlert } from 'lucide-react';

export default function MessageDetail({ selectedMsg, onInspectMime, onTamperTest }) {
  if (!selectedMsg) {
    return (
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', display: 'grid', placeItems: 'center', color: '#64748b', fontSize: '14px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        Select an email from the list on the left to view its decrypted message.
      </div>
    );
  }

  const isSuccess = selectedMsg.decrypt_status === 'SUCCESS';

  return (
    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>{selectedMsg.subject}</h2>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
            From: <strong>{selectedMsg.sender}</strong> &nbsp;|&nbsp; To: <strong>{selectedMsg.recipient}</strong>
          </div>
        </div>
        <span style={{
          fontSize: '11px', fontWeight: '700', padding: '6px 14px', borderRadius: '20px',
          background: selectedMsg.security_level === 3 ? '#ecfdf5' : '#eff6ff',
          color: selectedMsg.security_level === 3 ? '#047857' : '#1e40af',
          border: selectedMsg.security_level === 3 ? '1px solid #a7f3d0' : '1px solid #bfdbfe'
        }}>
          Security Level {selectedMsg.security_level} {selectedMsg.security_level === 3 ? '(One-Time Pad Unbreakable)' : '(Quantum-Seeded AES)'}
        </span>
      </div>

      {selectedMsg.key_id && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px', fontSize: '11px', fontFamily: 'var(--font-code)' }}>
          <span style={{ color: '#64748b' }}>ETSI QKD Key Identifier: </span>
          <span style={{ color: '#1e3a8a', fontWeight: '600' }}>{selectedMsg.key_id}</span>
        </div>
      )}

      <div style={{
        background: isSuccess ? '#f8fafc' : '#fef2f2',
        border: isSuccess ? '1px solid #cbd5e1' : '1px solid #fca5a5',
        color: isSuccess ? '#0f172a' : '#991b1b',
        borderRadius: '10px', padding: '18px', fontFamily: 'var(--font-code)', fontSize: '13px', minHeight: '140px', wordBreak: 'break-all', lineHeight: '1.6'
      }}>
        {selectedMsg.decrypted_body}
      </div>

      {selectedMsg.decrypted_attachments && selectedMsg.decrypted_attachments.length > 0 && (
        <div style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '10px', padding: '14px' }}>
          <div style={{ fontSize: '12px', fontWeight: '700', color: '#0369a1', marginBottom: '8px' }}>
            📎 Decrypted Attachments ({selectedMsg.decrypted_attachments.length}):
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {selectedMsg.decrypted_attachments.map((att, idx) => {
              const downloadUrl = att.data_b64 ? `data:${att.content_type};base64,${att.data_b64}` : null;
              return (
                <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#ffffff', border: '1px solid #e0f2fe', padding: '8px 12px', borderRadius: '6px' }}>
                  <span style={{ fontSize: '12px', fontWeight: '600', color: '#0f172a' }}>📄 {att.filename}</span>
                  {downloadUrl ? (
                    <a href={downloadUrl} download={att.filename} style={{ background: '#0284c7', color: '#ffffff', padding: '4px 10px', borderRadius: '4px', textDecoration: 'none', fontSize: '11px', fontWeight: '700' }}>
                      📥 Download Decrypted File
                    </a>
                  ) : (
                    <span style={{ color: '#ef4444', fontSize: '11px' }}>Key Expired</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: 'auto' }}>
        <button onClick={() => onInspectMime(selectedMsg)} style={{
          background: '#f8fafc', border: '1px solid #cbd5e1', color: '#1e293b',
          padding: '10px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
        }}>
          <Eye size={15} color="#2563eb" /> 🔍 Inspect Raw Encrypted Email
        </button>

        {selectedMsg.security_level > 1 && (
          <button onClick={() => onTamperTest(selectedMsg.id)} style={{
            background: '#fef2f2', border: '1px solid #fca5a5', color: '#991b1b',
            padding: '10px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
          }}>
            <Flame size={15} color="#dc2626" /> ⚡ Test Ciphertext Tamper Attack
          </button>
        )}
      </div>
    </div>
  );
}

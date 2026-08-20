import React, { useState, useEffect } from 'react';
import { Eye, Flame, Key, Lock, Unlock, Copy, Check, ShieldAlert } from 'lucide-react';

export default function MessageDetail({ selectedMsg, onInspectMime, onTamperTest }) {
  const [keyInput, setKeyInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    // Reset manual unlock state whenever selected message changes
    setKeyInput('');
    setErrorMsg('');
    if (selectedMsg && selectedMsg.security_level === 1) {
      setIsUnlocked(true); // Level 1 TLS has no QKD key required
    } else {
      setIsUnlocked(false); // Level 2, 3, 4 require manual key input
    }
  }, [selectedMsg?.id]);

  if (!selectedMsg) {
    return (
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', display: 'grid', placeItems: 'center', color: '#64748b', fontSize: '14px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
        Select an email from the list on the left to view its encrypted envelope.
      </div>
    );
  }

  const handleCopyKeyId = () => {
    if (selectedMsg.key_id) {
      navigator.clipboard.writeText(selectedMsg.key_id);
      setKeyInput(selectedMsg.key_id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleManualDecrypt = (e) => {
    e.preventDefault();
    setErrorMsg('');
    const cleanedInput = keyInput.trim();

    if (!cleanedInput) {
      setErrorMsg('Please enter or paste the QKD Key ID to decrypt.');
      return;
    }

    if (cleanedInput === selectedMsg.key_id) {
      setIsUnlocked(true);
    } else {
      setErrorMsg('❌ Invalid QKD Key ID! Decryption aborted to prevent key compromise.');
    }
  };

  return (
    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
      {/* Header Info */}
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

      {/* Key ID Banner */}
      {selectedMsg.key_id && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px 14px', fontSize: '11px', fontFamily: 'var(--font-code)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ color: '#64748b' }}>ETSI QKD Key ID: </span>
            <span style={{ color: '#1e3a8a', fontWeight: '600' }}>{selectedMsg.key_id}</span>
          </div>
          <button onClick={handleCopyKeyId} style={{
            background: '#ffffff', border: '1px solid #cbd5e1', color: '#1e293b',
            padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px'
          }}>
            {copied ? <Check size={12} color="#16a34a" /> : <Copy size={12} />}
            {copied ? 'Copied & Pasted!' : 'Copy Key ID'}
          </button>
        </div>
      )}

      {/* Manual Decryption Box (When Locked) */}
      {!isUnlocked && (
        <div style={{ background: '#f8fafc', border: '1px dashed #cbd5e1', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#1e3a8a', fontWeight: '700', fontSize: '13px' }}>
            <Lock size={16} color="#2563eb" /> 🔑 Manual QKD Key Authorization Required to Decrypt Message
          </div>
          <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
            To enforce single-use key security (ETSI GS QKD 014), paste or copy the matching QKD Key ID into the field below to authorize key consumption:
          </p>

          <form onSubmit={handleManualDecrypt} style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Paste or enter QKD Key ID here..."
              style={{
                flex: 1, padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1',
                fontSize: '12px', fontFamily: 'var(--font-code)', outline: 'none'
              }}
            />
            <button type="submit" style={{
              background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', color: '#ffffff',
              border: 'none', padding: '10px 18px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
            }}>
              <Unlock size={14} /> Authorize & Decrypt
            </button>
          </form>

          {errorMsg && (
            <div style={{ color: '#dc2626', fontSize: '12px', fontWeight: '600', background: '#fef2f2', padding: '8px 12px', borderRadius: '6px', border: '1px solid #fca5a5' }}>
              {errorMsg}
            </div>
          )}

          {/* Ciphertext Preview */}
          <div style={{ background: '#0f172a', color: '#38bdf8', padding: '14px', borderRadius: '8px', fontFamily: 'var(--font-code)', fontSize: '11px', wordBreak: 'break-all' }}>
            <div style={{ color: '#94a3b8', fontSize: '10px', marginBottom: '6px', fontWeight: '700' }}>🔒 RAW ENCRYPTED PAYLOAD (CIPHERTEXT BASE64):</div>
            {selectedMsg.body_b64 || '[Encrypted Bytes Locked]'}
          </div>
        </div>
      )}

      {/* Decrypted Payload Display (When Unlocked) */}
      {isUnlocked && (
        <div style={{
          background: selectedMsg.decrypt_status === 'SUCCESS' || selectedMsg.security_level === 1 ? '#f8fafc' : '#fef2f2',
          border: selectedMsg.decrypt_status === 'SUCCESS' || selectedMsg.security_level === 1 ? '1px solid #cbd5e1' : '1px solid #fca5a5',
          color: selectedMsg.decrypt_status === 'SUCCESS' || selectedMsg.security_level === 1 ? '#0f172a' : '#991b1b',
          borderRadius: '10px', padding: '18px', fontFamily: 'var(--font-code)', fontSize: '13px', minHeight: '140px', wordBreak: 'break-all', lineHeight: '1.6'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#166534', fontSize: '11px', fontWeight: '700', marginBottom: '10px' }}>
            <Unlock size={14} color="#16a34a" /> 🔓 DECRYPTED PLAINTEXT MESSAGE BODY:
          </div>
          {selectedMsg.decrypted_body}
        </div>
      )}

      {/* Decrypted Attachments */}
      {isUnlocked && selectedMsg.decrypted_attachments && selectedMsg.decrypted_attachments.length > 0 && (
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

      {/* Action Buttons */}
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

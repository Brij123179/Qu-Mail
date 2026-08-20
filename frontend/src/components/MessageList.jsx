import React from 'react';
import { Search } from 'lucide-react';

export default function MessageList({ messages, selectedMsg, setSelectedMsg, setIsComposing, searchQuery, setSearchQuery }) {
  const filteredMessages = messages.filter((m) =>
    m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    m.sender.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '8px', padding: '8px 12px' }}>
        <Search size={14} color="#64748b" />
        <input type="text" placeholder="Search emails..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} style={{ border: 'none', background: 'transparent', padding: 0, fontSize: '13px', width: '100%', color: '#0f172a', outline: 'none' }} />
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', flex: 1 }}>
        {filteredMessages.length === 0 ? (
          <div style={{ color: '#64748b', textAlign: 'center', padding: '30px 10px', fontSize: '13px' }}>
            Mailbox empty. Click <strong>Compose Email</strong> to send a test message!
          </div>
        ) : (
          filteredMessages.map((msg) => {
            const isSelected = selectedMsg?.id === msg.id;
            return (
              <div key={msg.id} onClick={() => { setSelectedMsg(msg); setIsComposing(false); }} style={{
                background: isSelected ? '#eff6ff' : '#ffffff',
                border: isSelected ? '1px solid #2563eb' : '1px solid #e2e8f0',
                borderRadius: '10px', padding: '14px', cursor: 'pointer', transition: 'all 0.2s ease',
                boxShadow: isSelected ? '0 2px 8px rgba(37, 99, 235, 0.12)' : 'none'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{
                    fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '12px',
                    background: msg.security_level === 3 ? '#ecfdf5' : '#eff6ff',
                    color: msg.security_level === 3 ? '#047857' : '#1d4ed8',
                    border: msg.security_level === 3 ? '1px solid #a7f3d0' : '1px solid #bfdbfe'
                  }}>
                    Level {msg.security_level} {msg.security_level === 3 ? 'OTP' : 'AES'}
                  </span>
                  <span style={{ fontSize: '10px', color: '#64748b' }}>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                </div>

                <div style={{ fontWeight: '600', fontSize: '13px', color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {msg.subject}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>
                  From: {msg.sender}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

import React from 'react';

export default function KeyBankExplorer({ keyBank }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>🔑 ETSI GS QKD 014 Key Bank Telemetry</div>
      <div style={{ maxHeight: '420px', overflowY: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'var(--font-code)', fontSize: '12px' }}>
          <thead>
            <tr style={{ color: '#1e3a8a', textTransform: 'uppercase', borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
              <th style={{ padding: '10px', textAlign: 'left' }}>Key ID</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Bytes</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Purpose</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Status</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Created / Consumed</th>
            </tr>
          </thead>
          <tbody>
            {keyBank.map((k) => (
              <tr key={k.key_id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '10px', color: '#2563eb', fontWeight: '600' }}>{k.key_id.substring(0, 18)}...</td>
                <td style={{ padding: '10px' }}>{k.length_bytes} B</td>
                <td style={{ padding: '10px' }}>{k.purpose}</td>
                <td style={{ padding: '10px' }}>
                  <span style={{
                    fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '12px',
                    background: k.status === 'consumed' ? '#f3e8ff' : '#ecfdf5',
                    color: k.status === 'consumed' ? '#6b21a8' : '#047857'
                  }}>
                    {k.status.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '10px', color: '#64748b' }}>
                  {new Date(k.created_at).toLocaleTimeString()} {k.consumed_at ? ' / Burned' : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

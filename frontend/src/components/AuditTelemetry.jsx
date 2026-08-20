import React from 'react';
import { api } from '../services/api';

export default function AuditTelemetry({ auditLogs }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '16px', fontWeight: '700', color: '#7c3aed' }}>📡 ETSI QKD Audit Telemetry</div>
        <a
          href={api.exportAuditReportUrl('html')}
          target="_blank"
          rel="noreferrer"
          style={{
            background: 'linear-gradient(135deg, #6d28d9, #7c3aed)',
            color: '#ffffff',
            padding: '6px 14px',
            borderRadius: '6px',
            textDecoration: 'none',
            fontSize: '11px',
            fontWeight: '700',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            boxShadow: '0 2px 6px rgba(109, 40, 217, 0.2)'
          }}
        >
          📥 Export ETSI 014 Compliance Audit Certificate
        </a>
      </div>

      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '14px', fontFamily: 'var(--font-code)', fontSize: '11px', maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {auditLogs.length === 0 ? (
          <div style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>No audit events logged yet.</div>
        ) : (
          auditLogs.map((log) => (
            <div key={log.id} style={{ display: 'flex', gap: '10px', borderBottom: '1px solid #f1f5f9', paddingBottom: '6px' }}>
              <span style={{ color: '#64748b' }}>[{new Date(log.timestamp).toLocaleTimeString()}]</span>
              <span style={{ color: log.status === 'BREACH_PREVENTED' ? '#dc2626' : '#2563eb', fontWeight: '600' }}>{log.event_type}</span>
              <span style={{ color: '#7c3aed', fontWeight: '500' }}>{log.actor}</span>
              <span style={{ color: '#334155' }}>{JSON.stringify(log.details)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

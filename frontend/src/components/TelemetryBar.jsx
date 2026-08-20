import React from 'react';
import { KeyRound, ShieldCheck, Mail, Flame } from 'lucide-react';

export default function TelemetryBar({ stats }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', padding: '24px 32px 0 32px' }}>
      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Quantum Keys Generated</div>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', fontWeight: '700', color: '#1e3a8a', marginTop: '4px' }}>
          {stats?.qkd_telemetry?.total_keys_generated || 0}
        </div>
      </div>

      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Keys Burned (Consumed)</div>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', fontWeight: '700', color: '#7c3aed', marginTop: '4px' }}>
          {stats?.qkd_telemetry?.keys_consumed || 0}
        </div>
      </div>

      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Protected Emails Sent</div>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', fontWeight: '700', color: '#059669', marginTop: '4px' }}>
          {stats?.email_telemetry?.total_emails_sent || 0}
        </div>
      </div>

      <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '16px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
        <div style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600', letterSpacing: '0.5px' }}>Replay Attacks Blocked</div>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: '26px', fontWeight: '700', color: '#dc2626', marginTop: '4px' }}>
          {stats?.audit_summary?.breaches_prevented || 0}
        </div>
      </div>
    </div>
  );
}

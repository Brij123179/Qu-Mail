import React from 'react';
import { ShieldCheck, HelpCircle, ExternalLink, Activity } from 'lucide-react';

export default function Header({ onOpenPhysics, transportMode }) {
  return (
    <header style={{
      background: '#ffffff',
      borderBottom: '1px solid #e2e8f0',
      padding: '16px 32px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.03)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <div style={{
          width: '42px', height: '42px',
          background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
          borderRadius: '10px', display: 'grid', placeItems: 'center',
          fontFamily: 'var(--font-heading)', fontWeight: '800', fontSize: '20px', color: '#fff',
          boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
        }}>
          Q
        </div>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: '700', color: '#0f172a' }}>
            QuMail
          </h1>
          <p style={{ fontSize: '12px', color: '#64748b' }}>
            Quantum-Secured Email Client (ETSI GS QKD 014 Compliant)
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button onClick={onOpenPhysics} style={{
          background: '#f0fdf4', border: '1px solid #bbf7d0',
          color: '#166534', padding: '8px 16px', borderRadius: '20px', fontSize: '13px',
          fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
        }}>
          <HelpCircle size={15} /> How QKD Works (Jury Explanation)
        </button>

        <span style={{
          background: '#eff6ff', border: '1px solid #bfdbfe',
          color: '#1e40af', padding: '8px 16px', borderRadius: '20px', fontSize: '12px',
          fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px'
        }}>
          <Activity size={14} color="#2563eb" /> Status: QKD Key Manager Online
        </span>

        <a href="/docs" target="_blank" rel="noreferrer" style={{
          background: '#f8fafc', border: '1px solid #cbd5e1',
          color: '#475569', padding: '8px 14px', borderRadius: '20px', fontSize: '12px',
          textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '500'
        }}>
          <ExternalLink size={14} /> ETSI API Docs
        </a>
      </div>
    </header>
  );
}

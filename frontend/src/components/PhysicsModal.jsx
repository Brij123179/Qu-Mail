import React from 'react';
import { X, HelpCircle, ShieldCheck } from 'lucide-react';

export default function PhysicsModal({ onClose }) {
  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(6px)', display: 'grid', placeItems: 'center', zIndex: 999 }}>
      <div style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '28px', width: '90%', maxWidth: '680px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e2e8f0', paddingBottom: '12px' }}>
          <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '18px', fontWeight: '700', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <HelpCircle color="#2563eb" size={20} /> How QKD Works (Jury Explanation Guide)
          </h3>
          <X cursor="pointer" onClick={onClose} color="#64748b" />
        </div>

        <div style={{ fontSize: '13px', color: '#334155', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '16px' }}>
            <strong style={{ color: '#1e40af', fontSize: '14px' }}>1. Cloudflare's Lava Lamps (Entropy Generation)</strong>
            <p style={{ marginTop: '4px', color: '#1e293b' }}>
              Cloudflare points cameras at 100 lava lamps in its lobby to capture fluid wax chaos to seed keys. This solves <strong>"How do we generate true random keys?"</strong> but cannot detect eavesdroppers in transit.
            </p>
          </div>

          <div style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: '10px', padding: '16px' }}>
            <strong style={{ color: '#065f46', fontSize: '14px' }}>2. Quantum Key Distribution (QKD) & Physics</strong>
            <p style={{ marginTop: '4px', color: '#064e3b' }}>
              QKD uses single photons over optical fiber (BB84 protocol). Under the <strong>Heisenberg Uncertainty Principle</strong> and <strong>No-Cloning Theorem</strong> (|ψ⟩), any measurement by an eavesdropper alters photon states!
            </p>
            <p style={{ marginTop: '6px', fontStyle: 'italic', color: '#047857', fontWeight: '500' }}>
              <strong>The Soap Bubble Analogy:</strong> A quantum key is like a key made of soap bubbles — the instant an eavesdropper touches it to copy it, it pops, and both parties detect the intrusion!
            </p>
          </div>

          <div style={{ background: '#f3e8ff', border: '1px solid #d8b4fe', borderRadius: '10px', padding: '16px' }}>
            <strong style={{ color: '#6b21a8', fontSize: '14px' }}>3. QuMail ETSI GS QKD 014 Integration</strong>
            <p style={{ marginTop: '4px', color: '#581c87' }}>
              QuMail interfaces with Key Managers via the industry-standard <strong>ETSI GS QKD 014 REST API</strong>. Keys are issued once and burned immediately upon decryption (returning <strong>HTTP 410 Gone</strong> on key reuse attempts).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

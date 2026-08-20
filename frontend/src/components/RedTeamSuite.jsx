import React, { useState } from 'react';
import { Flame, ShieldCheck, ShieldAlert, Zap, Lock, Skull } from 'lucide-react';
import { api } from '../services/api';

export default function RedTeamSuite({ attackKeyId, setAttackKeyId, onExecuteAttack, attackResult, messages = [] }) {
  const [selectedMsgId, setSelectedMsgId] = useState('');
  const [attackType, setAttackType] = useState('replay'); // replay, harvest, tamper
  const [harvestResult, setHarvestResult] = useState(null);
  const [tamperResult, setTamperResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleRunHarvestAttack = async () => {
    if (!selectedMsgId) {
      alert('Please select an intercepted email to attack.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.testHarvestAttack(selectedMsgId);
      setHarvestResult(res);
    } catch (err) {
      alert(`Harvest attack failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRunTamperAttack = async () => {
    if (!selectedMsgId) {
      alert('Please select an intercepted email to attack.');
      return;
    }
    setLoading(true);
    try {
      const res = await api.testTamperAttack(selectedMsgId);
      setTamperResult(res);
    } catch (err) {
      alert(`Tamper attack failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Eve Persona Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #450a0a, #7f1d1d)',
        border: '1px solid #991b1b',
        borderRadius: '12px',
        padding: '16px',
        color: '#fef2f2',
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        boxShadow: '0 4px 12px rgba(127, 29, 29, 0.25)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Skull size={24} color="#fca5a5" />
          <div>
            <div style={{ fontFamily: 'var(--font-heading)', fontWeight: '700', fontSize: '15px', color: '#ffffff' }}>
              🚨 Eve's Adversary Interceptor Console
            </div>
            <div style={{ fontSize: '11px', color: '#fca5a5', marginTop: '2px' }}>
              Simulating Man-in-the-Middle (MITM) Eavesdropper & Quantum Supercomputer Decryption Attacks
            </div>
          </div>
        </div>
        <span style={{ background: '#b91c1c', color: '#ffffff', padding: '4px 10px', borderRadius: '12px', fontSize: '10px', fontWeight: '800', textTransform: 'uppercase' }}>
          Red Team Mode Active
        </span>
      </div>

      {/* Attack Arsenal Selector */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        {[
          { id: 'replay', name: '1. Replay & Key Steal', desc: 'HTTP 410 Single-Use Key Burn' },
          { id: 'harvest', name: '2. Quantum Harvest', desc: 'Harvest Now Decrypt Later' },
          { id: 'tamper', name: '3. AEAD Bit-Flip', desc: 'Transit Payload Manipulation' },
        ].map((item) => (
          <button
            key={item.id}
            onClick={() => setAttackType(item.id)}
            style={{
              background: attackType === item.id ? '#fef2f2' : '#ffffff',
              border: attackType === item.id ? '2px solid #dc2626' : '1px solid #e2e8f0',
              borderRadius: '10px',
              padding: '12px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              boxShadow: attackType === item.id ? '0 2px 8px rgba(220, 38, 38, 0.15)' : 'none'
            }}
          >
            <div style={{ fontFamily: 'var(--font-heading)', fontSize: '12px', fontWeight: '700', color: attackType === item.id ? '#991b1b' : '#0f172a' }}>
              {item.name}
            </div>
            <div style={{ fontSize: '9px', color: '#64748b', marginTop: '2px' }}>{item.desc}</div>
          </button>
        ))}
      </div>

      {/* Scenario 1: Replay Attack */}
      {attackType === 'replay' && (
        <div style={{ background: '#ffffff', border: '1px solid #fee2e2', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: '700', fontSize: '14px', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Flame size={16} color="#dc2626" /> Scenario 1: Key Replay & Eavesdropped Key Stealing
          </div>
          <p style={{ fontSize: '12px', color: '#475569', lineHeight: '1.5' }}>
            Attempt to fetch a QKD <code>key_id</code> after recipient decryption. QuMail's Key Manager enforces single-use policy and burns the key, returning <strong>HTTP 410 Gone</strong>.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Target Key ID (UUID)</label>
            <input
              type="text"
              value={attackKeyId}
              onChange={(e) => setAttackKeyId(e.target.value)}
              placeholder="Paste Key ID here..."
              style={{ fontSize: '12px', padding: '10px' }}
            />
          </div>

          <button
            onClick={onExecuteAttack}
            style={{
              background: 'linear-gradient(135deg, #dc2626, #991b1b)',
              color: '#ffffff',
              fontFamily: 'var(--font-heading)',
              fontWeight: '700',
              fontSize: '13px',
              padding: '10px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              justify: 'center',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Flame size={16} /> Execute Replay Key Steal Test
          </button>

          {attackResult && (
            <div style={{
              padding: '14px', borderRadius: '8px', fontFamily: 'var(--font-code)', fontSize: '11px',
              background: attackResult.status_code === 410 ? '#ecfdf5' : '#fef2f2',
              border: attackResult.status_code === 410 ? '1px solid #a7f3d0' : '1px solid #fca5a5',
              color: attackResult.status_code === 410 ? '#065f46' : '#991b1b'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '12px' }}>
                {attackResult.status_code === 410 ? <ShieldCheck size={16} color="#059669" /> : <ShieldAlert size={16} color="#dc2626" />}
                {attackResult.status_code === 410 ? 'DEFENSE SUCCESS: HTTP 410 GONE (KEY BURNED)' : 'ATTACK STATUS'}
              </div>
              <p style={{ marginTop: '6px' }}>{attackResult.details}</p>
              <p style={{ marginTop: '6px', fontSize: '10px', fontStyle: 'italic' }}>{attackResult.mitigation_explanation}</p>
            </div>
          )}
        </div>
      )}

      {/* Scenario 2: Harvest Now Decrypt Later */}
      {attackType === 'harvest' && (
        <div style={{ background: '#ffffff', border: '1px solid #fee2e2', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: '700', fontSize: '14px', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Lock size={16} color="#dc2626" /> Scenario 2: "Harvest Now, Decrypt Later" Quantum Attack
          </div>
          <p style={{ fontSize: '12px', color: '#475569', lineHeight: '1.5' }}>
            Simulates Eve storing recorded email traffic on disk today and running a quantum computer (Shor's / Grover's algorithm) to decrypt historical payloads without the QKD key.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Select Intercepted Message</label>
            <select
              value={selectedMsgId}
              onChange={(e) => setSelectedMsgId(e.target.value)}
              style={{ fontSize: '12px', padding: '8px', background: '#f8fafc', borderColor: '#cbd5e1' }}
            >
              <option value="">-- Choose Intercepted Email --</option>
              {messages.map((m) => (
                <option key={m.id} value={m.id}>
                  L{m.security_level} | {m.subject} (From: {m.sender})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleRunHarvestAttack}
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #b91c1c, #7f1d1d)',
              color: '#ffffff',
              fontFamily: 'var(--font-heading)',
              fontWeight: '700',
              fontSize: '13px',
              padding: '10px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              justify: 'center',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Skull size={16} /> Run Quantum Harvest Decryption
          </button>

          {harvestResult && (
            <div style={{
              padding: '14px', borderRadius: '8px', fontFamily: 'var(--font-code)', fontSize: '11px',
              background: harvestResult.success ? '#fef2f2' : '#ecfdf5',
              border: harvestResult.success ? '1px solid #fca5a5' : '1px solid #a7f3d0',
              color: harvestResult.success ? '#991b1b' : '#065f46'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '12px' }}>
                {harvestResult.success ? <ShieldAlert size={16} color="#dc2626" /> : <ShieldCheck size={16} color="#059669" />}
                {harvestResult.attack_type}
              </div>
              <p style={{ marginTop: '6px' }}>{harvestResult.details}</p>
              <p style={{ marginTop: '6px', fontSize: '10px', fontStyle: 'italic' }}>{harvestResult.mitigation_explanation}</p>
            </div>
          )}
        </div>
      )}

      {/* Scenario 3: AEAD Bit-Flip Tamper Attack */}
      {attackType === 'tamper' && (
        <div style={{ background: '#ffffff', border: '1px solid #fee2e2', borderRadius: '12px', padding: '18px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: '700', fontSize: '14px', color: '#991b1b', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Zap size={16} color="#dc2626" /> Scenario 3: Transit Ciphertext Bit-Flip Tampering
          </div>
          <p style={{ fontSize: '12px', color: '#475569', lineHeight: '1.5' }}>
            Eve intercepts an encrypted packet in transit and flips bit values. Verifies that AES-GCM or Kyber AEAD tag verification aborts decryption immediately.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '10px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase' }}>Select Intercepted Message</label>
            <select
              value={selectedMsgId}
              onChange={(e) => setSelectedMsgId(e.target.value)}
              style={{ fontSize: '12px', padding: '8px', background: '#f8fafc', borderColor: '#cbd5e1' }}
            >
              <option value="">-- Choose Intercepted Email --</option>
              {messages.map((m) => (
                <option key={m.id} value={m.id}>
                  L{m.security_level} | {m.subject} (From: {m.sender})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleRunTamperAttack}
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #dc2626, #b91c1c)',
              color: '#ffffff',
              fontFamily: 'var(--font-heading)',
              fontWeight: '700',
              fontSize: '13px',
              padding: '10px',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              display: 'flex',
              justify: 'center',
              alignItems: 'center',
              gap: '8px'
            }}
          >
            <Zap size={16} /> Inject Transit Bit-Flip Attack
          </button>

          {tamperResult && (
            <div style={{
              padding: '14px', borderRadius: '8px', fontFamily: 'var(--font-code)', fontSize: '11px',
              background: tamperResult.success ? '#fef2f2' : '#ecfdf5',
              border: tamperResult.success ? '1px solid #fca5a5' : '1px solid #a7f3d0',
              color: tamperResult.success ? '#991b1b' : '#065f46'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '700', fontSize: '12px' }}>
                {!tamperResult.success ? <ShieldCheck size={16} color="#059669" /> : <ShieldAlert size={16} color="#dc2626" />}
                {tamperResult.attack_type}
              </div>
              <p style={{ marginTop: '6px' }}>{tamperResult.details}</p>
              <p style={{ marginTop: '6px', fontSize: '10px', fontStyle: 'italic' }}>{tamperResult.mitigation_explanation}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import React from 'react';
import { Send, Inbox, KeyRound, Flame, Activity } from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, isComposing, setIsComposing, currentUser, setCurrentUser, unreadCount }) {
  return (
    <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 2px 10px rgba(0,0,0,0.02)' }}>
      <button onClick={() => { setIsComposing(true); setActiveTab('inbox'); }} style={{
        background: 'linear-gradient(135deg, #1e3a8a, #2563eb)', color: '#ffffff',
        fontFamily: 'var(--font-heading)', fontWeight: '700', fontSize: '13px',
        padding: '12px', border: 'none', borderRadius: '10px', cursor: 'pointer',
        display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px',
        boxShadow: '0 4px 12px rgba(37, 99, 235, 0.25)'
      }}>
        <Send size={16} /> Compose Email
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div onClick={() => { setActiveTab('inbox'); setIsComposing(false); }} style={{
          padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
          display: 'flex', alignItems: 'center', gap: '10px',
          background: activeTab === 'inbox' && !isComposing ? '#eff6ff' : 'transparent',
          color: activeTab === 'inbox' && !isComposing ? '#1d4ed8' : '#475569',
          fontWeight: activeTab === 'inbox' && !isComposing ? '600' : '500'
        }}>
          <Inbox size={16} /> Inbox ({unreadCount})
        </div>

        <div onClick={() => { setActiveTab('keys'); setIsComposing(false); }} style={{
          padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
          display: 'flex', alignItems: 'center', gap: '10px',
          background: activeTab === 'keys' ? '#eff6ff' : 'transparent',
          color: activeTab === 'keys' ? '#1d4ed8' : '#475569',
          fontWeight: activeTab === 'keys' ? '600' : '500'
        }}>
          <KeyRound size={16} /> Key Bank Telemetry
        </div>

        <div onClick={() => { setActiveTab('redteam'); setIsComposing(false); }} style={{
          padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
          display: 'flex', alignItems: 'center', gap: '10px',
          background: activeTab === 'redteam' ? '#fef2f2' : 'transparent',
          color: activeTab === 'redteam' ? '#dc2626' : '#475569',
          fontWeight: activeTab === 'redteam' ? '600' : '500'
        }}>
          <Flame size={16} /> Replay Attack Test
        </div>

        <div onClick={() => { setActiveTab('audit'); setIsComposing(false); }} style={{
          padding: '10px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13px',
          display: 'flex', alignItems: 'center', gap: '10px',
          background: activeTab === 'audit' ? '#f5f3ff' : 'transparent',
          color: activeTab === 'audit' ? '#7c3aed' : '#475569',
          fontWeight: activeTab === 'audit' ? '600' : '500'
        }}>
          <Activity size={16} /> Audit Telemetry
        </div>
      </div>

      <div style={{ marginTop: 'auto', borderTop: '1px solid #f1f5f9', paddingTop: '16px' }}>
        <label style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: '600' }}>Active User Mailbox</label>
        <select value={currentUser} onChange={(e) => setCurrentUser(e.target.value)} style={{ width: '100%', marginTop: '6px', fontSize: '12px', background: '#f8fafc', borderColor: '#cbd5e1' }}>
          <option value="bob@qumail.sec">Bob (bob@qumail.sec)</option>
          <option value="alice@qumail.sec">Alice (alice@qumail.sec)</option>
          <option value="eve@adversary.sec">🚨 Eve (Red Team Attacker / Interceptor)</option>
          <option value="all">View All Mailboxes</option>
        </select>
      </div>
    </div>
  );
}

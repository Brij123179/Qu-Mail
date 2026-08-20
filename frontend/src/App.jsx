import React, { useState, useEffect } from 'react';
import { api } from './services/api';

import Header from './components/Header';
import TelemetryBar from './components/TelemetryBar';
import Sidebar from './components/Sidebar';
import MessageList from './components/MessageList';
import MessageDetail from './components/MessageDetail';
import EmailComposer from './components/EmailComposer';
import KeyBankExplorer from './components/KeyBankExplorer';
import RedTeamSuite from './components/RedTeamSuite';
import AuditTelemetry from './components/AuditTelemetry';
import PhysicsModal from './components/PhysicsModal';
import MimeInspectorModal from './components/MimeInspectorModal';
import TransportModal from './components/TransportModal';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState('inbox'); // inbox, keys, redteam, audit
  const [currentUser, setCurrentUser] = useState('bob@qumail.sec');

  // Mail Data State
  const [messages, setMessages] = useState([]);
  const [selectedMsg, setSelectedMsg] = useState(null);
  const [isComposing, setIsComposing] = useState(false);

  // Form State
  const [sender, setSender] = useState('alice@qumail.sec');
  const [recipient, setRecipient] = useState('bob@qumail.sec');
  const [subject, setSubject] = useState('QKD Node Sync & Key Deployment');
  const [body, setBody] = useState('This message is secured using QKD derived keys over ETSI GS QKD 014 API.');
  const [securityLevel, setSecurityLevel] = useState(2);
  const [attachments, setAttachments] = useState([]);

  // Telemetry & Data State
  const [stats, setStats] = useState(null);
  const [keyBank, setKeyBank] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Modals State
  const [showPhysicsModal, setShowPhysicsModal] = useState(false);
  const [showMimeModal, setShowMimeModal] = useState(false);
  const [inspectMimeData, setInspectMimeData] = useState(null);
  const [showTransportModal, setShowTransportModal] = useState(false);
  const [transportConfig, setTransportConfig] = useState(null);

  // Red Team Attack State
  const [attackKeyId, setAttackKeyId] = useState('');
  const [attackResult, setAttackResult] = useState(null);

  // Fetch API Calls
  const fetchDashboardStats = async () => {
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchInbox = async () => {
    try {
      const data = await api.getInbox(currentUser);
      setMessages(data.messages || []);
      if (data.messages && data.messages.length > 0 && !selectedMsg) {
        setSelectedMsg(data.messages[0]);
      }
    } catch (err) {
      console.error('Failed to fetch inbox:', err);
    }
  };

  const fetchKeyBank = async () => {
    try {
      const data = await api.getKeyBank(50);
      setKeyBank(data || []);
    } catch (err) {
      console.error('Failed to fetch key bank:', err);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      const data = await api.getAuditLogs(40);
      setAuditLogs(data || []);
    } catch (err) {
      console.error('Failed to fetch audit logs:', err);
    }
  };

  const fetchTransportConfig = async () => {
    try {
      const data = await api.getTransportConfig();
      setTransportConfig(data);
    } catch (err) {
      console.error('Failed to fetch transport config:', err);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
    fetchInbox();
    fetchKeyBank();
    fetchAuditLogs();
    fetchTransportConfig();

    const interval = setInterval(() => {
      fetchDashboardStats();
      fetchInbox();
      fetchKeyBank();
      fetchAuditLogs();
    }, 5000);
    return () => clearInterval(interval);
  }, [currentUser]);

  // Handlers
  const handleSendEmail = async (e) => {
    e.preventDefault();
    try {
      const res = await api.sendEmail({
        sender,
        recipient,
        subject,
        body,
        security_level: securityLevel,
        attachments,
      });

      alert(`Email Sent Successfully! Key ID: ${res.data?.key_id || 'None (TLS)'}`);
      if (res.data?.key_id) {
        setAttackKeyId(res.data.key_id);
      }
      setAttachments([]);
      setIsComposing(false);
      fetchInbox();
      fetchKeyBank();
      fetchDashboardStats();
      fetchAuditLogs();
    } catch (err) {
      alert(`Send Failed: ${err.response?.data?.detail || err.message}`);
    }
  };

  const handleReplayAttack = async () => {
    if (!attackKeyId.trim()) {
      alert('Please enter a Key ID');
      return;
    }
    try {
      const res = await api.executeReplayAttack(attackKeyId.trim());
      setAttackResult(res);
      fetchDashboardStats();
      fetchKeyBank();
      fetchAuditLogs();
    } catch (err) {
      alert(`Attack test error: ${err.message}`);
    }
  };

  const handleTamperTest = async (msgId) => {
    try {
      const res = await api.testTamperAttack(msgId);
      alert(`AEAD Tamper Test Result:\n\n${res.details}\n\nMitigation: ${res.mitigation_explanation}`);
      fetchDashboardStats();
      fetchAuditLogs();
    } catch (err) {
      alert(`Tamper test failed: ${err.message}`);
    }
  };

  const handleInspectMime = (msg) => {
    setInspectMimeData(msg);
    setShowMimeModal(true);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', background: 'var(--bg-dark)' }}>

      {/* Header Component */}
      <Header
        onOpenPhysics={() => setShowPhysicsModal(true)}
        onOpenTransport={() => setShowTransportModal(true)}
        transportMode={transportConfig?.mode}
      />

      {/* Telemetry Bar Component */}
      <TelemetryBar stats={stats} />

      {/* Main 3-Pane Outlook Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 340px 1fr', gap: '16px', padding: '20px 28px', flex: 1 }}>

        {/* Pane 1: Sidebar Navigation Component */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          isComposing={isComposing}
          setIsComposing={setIsComposing}
          currentUser={currentUser}
          setCurrentUser={setCurrentUser}
          unreadCount={messages.length}
        />

        {/* Pane 2: Message List Component */}
        <MessageList
          messages={messages}
          selectedMsg={selectedMsg}
          setSelectedMsg={setSelectedMsg}
          setIsComposing={setIsComposing}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* Pane 3: Content Pane / Composer / Key Explorer / Red Team / Audit */}
        <div style={{ background: 'var(--panel-bg)', border: '1px solid var(--panel-border)', borderRadius: '16px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {isComposing ? (
            <EmailComposer
              sender={sender} setSender={setSender}
              recipient={recipient} setRecipient={setRecipient}
              subject={subject} setSubject={setSubject}
              body={body} setBody={setBody}
              securityLevel={securityLevel} setSecurityLevel={setSecurityLevel}
              attachments={attachments} setAttachments={setAttachments}
              onSend={handleSendEmail}
              onCancel={() => setIsComposing(false)}
            />
          ) : activeTab === 'inbox' ? (
            <MessageDetail
              selectedMsg={selectedMsg}
              onInspectMime={handleInspectMime}
              onTamperTest={handleTamperTest}
            />
          ) : activeTab === 'keys' ? (
            <KeyBankExplorer keyBank={keyBank} />
          ) : activeTab === 'redteam' ? (
            <RedTeamSuite
              attackKeyId={attackKeyId}
              setAttackKeyId={setAttackKeyId}
              onExecuteAttack={handleReplayAttack}
              attackResult={attackResult}
              messages={messages}
            />
          ) : (
            <AuditTelemetry auditLogs={auditLogs} />
          )}
        </div>

      </div>

      {/* Modals */}
      {showPhysicsModal && <PhysicsModal onClose={() => setShowPhysicsModal(false)} />}
      {showMimeModal && <MimeInspectorModal inspectMimeData={inspectMimeData} onClose={() => setShowMimeModal(false)} />}
      {showTransportModal && (
        <TransportModal
          onClose={() => setShowTransportModal(false)}
          currentConfig={transportConfig}
          onSaved={() => { fetchTransportConfig(); fetchDashboardStats(); }}
        />
      )}

    </div>
  );
}

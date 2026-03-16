import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const STANCE_COLORS = {
  favorável: '#34d399',
  neutro: '#9090a8',
  contrário: '#f87171',
  cético: '#fbbf24',
};

function useElapsedTime(running) {
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(interval);
  }, [running]);
  const m = Math.floor(elapsed / 60).toString().padStart(2, '0');
  const s = (elapsed % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function Simulation() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [agents, setAgents] = useState([]);
  const [messages, setMessages] = useState([]);
  const [report, setReport] = useState(null);
  const [status, setStatus] = useState('pending');
  const [currentRound, setCurrentRound] = useState(0);
  const [totalRounds, setTotalRounds] = useState(0);
  const [logs, setLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('chat');
  const [scenario, setScenario] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [agentProgress, setAgentProgress] = useState(null);
  const chatRef = useRef(null);
  const eventSourceRef = useRef(null);
  const elapsed = useElapsedTime(status === 'running');

  useEffect(() => {
    axios.get(`${API}/simulate/${id}`).then(r => setScenario(r.data.scenario)).catch(() => {});

    const eventSource = new EventSource(`${API}/simulate/${id}/stream`);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (e) => {
      const data = JSON.parse(e.data);
      if (data.type === 'status') {
        setStatus(data.status);
        if (data.status === 'completed') {
          eventSource.close();
          setActiveTab('report');
          setAgentProgress(null);
        }
      }
      if (data.type === 'agents') setAgents(data.agents);
      if (data.type === 'round_start') {
        setCurrentRound(data.round);
        setTotalRounds(data.total);
        setAgentProgress(null);
      }
      if (data.type === 'agent_progress') {
        setAgentProgress({ current: data.current, total: data.total, name: data.agent_name, emoji: data.agent_emoji });
      }
      if (data.type === 'message') {
        setMessages(prev => [...prev, data.message]);
      }
      if (data.type === 'report') setReport(data.report);
      if (data.type === 'log') setLogs(prev => [...prev, data.message]);
      if (data.type === 'error') {
        setStatus('error');
        setErrorMsg(data.message);
        setAgentProgress(null);
        eventSource.close();
      }
    };

    eventSource.onerror = () => {
      if (status !== 'completed') {
        setStatus('error');
        setErrorMsg('Conexão perdida. Verifique se o Ollama está rodando com "ollama serve" e tente novamente.');
      }
      eventSource.close();
    };

    return () => eventSource.close();
  }, [id]);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages, agentProgress]);

  const handleCancel = () => {
    if (eventSourceRef.current) eventSourceRef.current.close();
    setStatus('error');
    setErrorMsg('Simulação cancelada pelo usuário.');
    setAgentProgress(null);
  };

  const totalAgents = agents.length || 1;
  const totalSteps = totalRounds * totalAgents;
  const progressPercent = totalSteps > 0 ? Math.min(100, Math.round((messages.length / totalSteps) * 100)) : 0;
  const roundMessages = (r) => messages.filter(m => m.round === r);

  return (
    <div className="sim-page">
      {/* Header */}
      <div className="sim-header">
        <button className="back-btn" onClick={() => navigate('/')}>← Voltar</button>
        <div className="sim-title-row">
          <div>
            <h1 className="sim-title">Simulação em Progresso</h1>
            <p className="sim-scenario">"{scenario}"</p>
          </div>
          <div className="header-right">
            {status === 'running' && <div className="elapsed-timer">⏱ {elapsed}</div>}
            <div className={`status-pill status-${status}`}>
              {status === 'running' && <span className="pulse-dot" />}
              {status === 'pending' && '⏳ Aguardando'}
              {status === 'running' && 'Executando'}
              {status === 'completed' && '✅ Concluída'}
              {status === 'error' && '❌ Erro'}
            </div>
            {status === 'running' && (
              <button className="cancel-btn" onClick={handleCancel}>✕ Cancelar</button>
            )}
          </div>
        </div>

        {status === 'running' && totalRounds > 0 && (
          <div className="progress-section">
            <div className="progress-bar-wrap">
              <div className="progress-label">
                <span>
                  Rodada {currentRound} de {totalRounds}
                  {agentProgress && <span className="agent-progress-label"> — {agentProgress.emoji} {agentProgress.name} pensando...</span>}
                </span>
                <span className="mono">{progressPercent}%</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
            {agentProgress && (
              <div className="agent-progress-row">
                {Array.from({ length: agentProgress.total }).map((_, i) => (
                  <div key={i} className={`agent-step ${i < agentProgress.current - 1 ? 'done' : i === agentProgress.current - 1 ? 'active' : 'pending'}`} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Error Screen */}
      {status === 'error' && (
        <div className="error-screen">
          <div className="error-card">
            <div className="error-icon">⚠️</div>
            <h2>Algo deu errado</h2>
            <p className="error-message">{errorMsg || 'Erro desconhecido.'}</p>
            <div className="error-tips">
              <p className="tips-title">O que verificar:</p>
              <ul>
                <li>O <strong>Ollama</strong> está rodando? Abra o Terminal e execute <code>ollama serve</code></li>
                <li>O <strong>Docker Desktop</strong> está aberto?</li>
                <li>Tente reduzir o número de agentes ou rodadas</li>
              </ul>
            </div>
            <button className="retry-btn" onClick={() => navigate('/')}>← Nova Simulação</button>
          </div>
        </div>
      )}

      {/* Main Body */}
      {status !== 'error' && (
        <div className="sim-body">
          <aside className="agents-panel">
            <div className="panel-title">
              <span>👥</span> Agentes
              <span className="count-badge">{agents.length}</span>
            </div>
            {agents.length === 0 ? (
              <div className="loading-agents">
                <div className="skeleton" /><div className="skeleton" /><div className="skeleton" />
                <p className="loading-hint">Gerando agentes...</p>
              </div>
            ) : (
              agents.map(agent => {
                const isActive = agentProgress?.name === agent.name;
                const isDone = messages.some(m => m.agent_id === agent.id);
                return (
                  <div key={agent.id} className={`agent-card ${isActive ? 'agent-active' : ''} ${isDone && !isActive ? 'agent-done' : ''}`}>
                    <div className="agent-avatar" style={{ background: agent.color + '22', borderColor: isActive ? agent.color : agent.color + '44' }}>
                      <span style={{ fontSize: 22 }}>{agent.emoji}</span>
                      {isActive && <div className="agent-thinking-ring" style={{ borderColor: agent.color }} />}
                    </div>
                    <div className="agent-info">
                      <div className="agent-name">
                        {agent.name}
                        {isActive && <span className="thinking-badge">pensando...</span>}
                        {isDone && !isActive && <span className="done-badge">✓</span>}
                      </div>
                      <div className="agent-role">{agent.role}</div>
                      <div className="agent-stance" style={{ color: STANCE_COLORS[agent.stance] || '#9090a8' }}>● {agent.stance}</div>
                    </div>
                  </div>
                );
              })
            )}
            {logs.length > 0 && (
              <div className="log-panel">
                {logs.map((log, i) => <div key={i} className="log-entry">{log}</div>)}
              </div>
            )}
          </aside>

          <div className="main-panel">
            <div className="tabs">
              <button className={`tab ${activeTab === 'chat' ? 'active' : ''}`} onClick={() => setActiveTab('chat')}>
                💬 Debate {messages.length > 0 && <span className="tab-count">{messages.length}</span>}
              </button>
              <button className={`tab ${activeTab === 'report' ? 'active' : ''}`} onClick={() => setActiveTab('report')} disabled={!report}>
                📊 Relatório
              </button>
            </div>

            {activeTab === 'chat' && (
              <div className="chat-container" ref={chatRef}>
                {messages.length === 0 && status === 'running' && (
                  <div className="chat-placeholder">
                    <div className="typing-indicator"><span /><span /><span /></div>
                    <p>Os agentes estão sendo gerados...</p>
                  </div>
                )}
                {[...new Set(messages.map(m => m.round))].map(round => (
                  <div key={round} className="round-group">
                    <div className="round-divider"><span>Rodada {round}</span></div>
                    {roundMessages(round).map(msg => (
                      <div key={msg.id} className={`message-bubble fade-in ${msg.error ? 'msg-error' : ''}`}>
                        <div className="msg-avatar" style={{ background: msg.agent_color + '22', borderColor: msg.agent_color + '55' }}>{msg.agent_emoji}</div>
                        <div className="msg-body">
                          <div className="msg-header">
                            <span className="msg-name">{msg.agent_name}</span>
                            <span className="msg-role">{msg.agent_role}</span>
                            <span className="msg-stance" style={{ color: STANCE_COLORS[msg.stance] || '#9090a8' }}>{msg.stance}</span>
                          </div>
                          <div className="msg-content">{msg.content}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
                {status === 'running' && agentProgress && (
                  <div className="thinking-wrap">
                    <span className="thinking-emoji">{agentProgress.emoji}</span>
                    <div className="typing-indicator"><span /><span /><span /></div>
                    <span>{agentProgress.name} está pensando...</span>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'report' && report && (
              <div className="report-container">
                <div className="report-section">
                  <h2>Resumo Executivo</h2>
                  <p className="executive-summary">{report.executive_summary}</p>
                </div>
                <div className="sentiment-grid">
                  {Object.entries(report.sentiment_analysis || {}).map(([key, val]) => (
                    <div key={key} className="sentiment-card">
                      <div className="sentiment-val">{val}</div>
                      <div className="sentiment-label">{key}</div>
                    </div>
                  ))}
                </div>
                <div className="report-two-col">
                  <div className="report-section">
                    <h3>✅ Consensos</h3>
                    <ul className="report-list">{(report.consensus_points || []).map((p, i) => <li key={i}>{p}</li>)}</ul>
                  </div>
                  <div className="report-section">
                    <h3>⚡ Conflitos</h3>
                    <ul className="report-list conflict">{(report.conflict_points || []).map((p, i) => <li key={i}>{p}</li>)}</ul>
                  </div>
                </div>
                <div className="report-section">
                  <h3>🔍 Achados Principais</h3>
                  {(report.key_findings || []).map((f, i) => (
                    <div key={i} className={`finding-card`}>
                      <div className="finding-header">
                        <span className="finding-title">{f.title}</span>
                        <span className={`impact-badge ${f.impact}`}>{f.impact}</span>
                      </div>
                      <p>{f.description}</p>
                    </div>
                  ))}
                </div>
                <div className="report-section">
                  <h3>🔮 Previsões</h3>
                  {(report.predictions || []).map((p, i) => (
                    <div key={i} className="prediction-card">
                      <div className="prediction-header">
                        <span>{p.scenario}</span>
                        <span className={`prob-badge ${p.probability}`}>{p.probability}</span>
                      </div>
                      <p className="prediction-reason">{p.reasoning}</p>
                    </div>
                  ))}
                </div>
                <div className="report-section">
                  <h3>💡 Recomendações</h3>
                  <ol className="report-list recs">{(report.recommendations || []).map((r, i) => <li key={i}>{r}</li>)}</ol>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <style>{`
        .sim-page { display: flex; flex-direction: column; height: 100vh; overflow: hidden; }
        .sim-header { padding: 24px 32px 20px; border-bottom: 1px solid var(--border); background: var(--bg-2); flex-shrink: 0; }
        .back-btn { background: none; border: none; color: var(--text-2); cursor: pointer; font-size: 13px; font-family: inherit; margin-bottom: 12px; transition: color 0.15s; padding: 0; }
        .back-btn:hover { color: var(--text); }
        .sim-title-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
        .sim-title { font-size: 22px; font-weight: 700; margin-bottom: 4px; }
        .sim-scenario { color: var(--text-2); font-size: 14px; max-width: 600px; }
        .header-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
        .elapsed-timer { font-family: 'DM Mono', monospace; font-size: 13px; color: var(--text-2); background: var(--bg-4); padding: 4px 12px; border-radius: 100px; }
        .status-pill { display: flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: 100px; font-size: 13px; font-weight: 600; }
        .status-pending { background: var(--bg-4); color: var(--text-2); }
        .status-running { background: rgba(124,106,247,0.15); color: var(--accent-2); border: 1px solid rgba(124,106,247,0.3); }
        .status-completed { background: rgba(52,211,153,0.12); color: var(--green); border: 1px solid rgba(52,211,153,0.3); }
        .status-error { background: rgba(248,113,113,0.12); color: var(--red); border: 1px solid rgba(248,113,113,0.3); }
        .pulse-dot { width: 8px; height: 8px; background: var(--accent-2); border-radius: 50%; animation: pulse 1.5s infinite; }
        .cancel-btn { background: rgba(248,113,113,0.12); color: var(--red); border: 1px solid rgba(248,113,113,0.3); border-radius: 100px; padding: 6px 14px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; transition: all 0.15s; }
        .cancel-btn:hover { background: rgba(248,113,113,0.25); }
        .progress-section { margin-top: 8px; }
        .progress-bar-wrap { margin-bottom: 8px; }
        .progress-label { display: flex; justify-content: space-between; font-size: 12px; color: var(--text-2); margin-bottom: 6px; }
        .agent-progress-label { color: var(--accent-2); font-style: italic; }
        .progress-bar { background: var(--bg-4); border-radius: 100px; height: 4px; }
        .progress-fill { background: linear-gradient(90deg, var(--accent), var(--accent-2)); border-radius: 100px; height: 100%; transition: width 0.5s ease; }
        .agent-progress-row { display: flex; gap: 4px; margin-top: 6px; }
        .agent-step { height: 3px; flex: 1; border-radius: 100px; transition: all 0.3s; }
        .agent-step.done { background: var(--green); }
        .agent-step.active { background: var(--accent-2); animation: pulse 1s infinite; }
        .agent-step.pending { background: var(--bg-4); }
        .error-screen { flex: 1; display: flex; align-items: center; justify-content: center; padding: 40px; }
        .error-card { background: var(--bg-2); border: 1px solid rgba(248,113,113,0.3); border-radius: var(--radius-lg); padding: 40px; max-width: 520px; width: 100%; text-align: center; }
        .error-icon { font-size: 48px; margin-bottom: 16px; }
        .error-card h2 { font-size: 22px; font-weight: 800; margin-bottom: 12px; color: var(--red); }
        .error-message { background: var(--bg-3); border: 1px solid var(--border); border-radius: var(--radius); padding: 12px 16px; font-family: 'DM Mono', monospace; font-size: 13px; color: var(--text-2); margin-bottom: 20px; text-align: left; word-break: break-word; }
        .error-tips { background: var(--bg-3); border-radius: var(--radius); padding: 16px 20px; text-align: left; margin-bottom: 24px; }
        .tips-title { font-weight: 700; font-size: 13px; margin-bottom: 10px; color: var(--text-2); }
        .error-tips ul { list-style: none; display: flex; flex-direction: column; gap: 8px; }
        .error-tips li { font-size: 13px; color: var(--text-2); padding-left: 16px; position: relative; }
        .error-tips li::before { content: '→'; position: absolute; left: 0; color: var(--accent-2); }
        .error-tips code { background: var(--bg-4); padding: 1px 6px; border-radius: 4px; font-family: 'DM Mono', monospace; font-size: 12px; color: var(--accent-2); }
        .retry-btn { background: var(--accent); color: white; border: none; border-radius: var(--radius); padding: 12px 24px; font-family: 'Syne', sans-serif; font-weight: 700; font-size: 15px; cursor: pointer; transition: all 0.2s; }
        .retry-btn:hover { background: var(--accent-2); }
        .sim-body { display: flex; flex: 1; overflow: hidden; }
        .agents-panel { width: 260px; flex-shrink: 0; background: var(--bg-2); border-right: 1px solid var(--border); overflow-y: auto; padding: 20px 16px; display: flex; flex-direction: column; gap: 10px; }
        .panel-title { font-family: 'Syne', sans-serif; font-weight: 700; font-size: 13px; color: var(--text-2); text-transform: uppercase; letter-spacing: 0.08em; display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
        .count-badge { background: var(--bg-4); border-radius: 100px; font-size: 11px; padding: 1px 8px; color: var(--text-3); font-family: 'DM Mono', monospace; }
        .loading-agents { display: flex; flex-direction: column; gap: 10px; }
        .loading-hint { font-size: 12px; color: var(--text-3); font-family: 'DM Mono', monospace; text-align: center; margin-top: 4px; animation: pulse 1.5s infinite; }
        .agent-card { display: flex; gap: 10px; align-items: flex-start; background: var(--bg-3); border: 1px solid var(--border); border-radius: var(--radius); padding: 12px; transition: all 0.3s; position: relative; }
        .agent-card.agent-active { border-color: var(--accent); background: var(--accent-glow); }
        .agent-card.agent-done { opacity: 0.65; }
        .agent-avatar { width: 40px; height: 40px; border-radius: 10px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border: 1px solid; position: relative; }
        .agent-thinking-ring { position: absolute; inset: -4px; border-radius: 14px; border: 2px solid; animation: spin 1.5s linear infinite; }
        .agent-name { font-size: 13px; font-weight: 600; margin-bottom: 2px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
        .thinking-badge { font-size: 10px; font-family: 'DM Mono', monospace; color: var(--accent-2); animation: pulse 1s infinite; }
        .done-badge { font-size: 11px; color: var(--green); }
        .agent-role { font-size: 11px; color: var(--text-2); margin-bottom: 4px; }
        .agent-stance { font-size: 11px; font-family: 'DM Mono', monospace; }
        .skeleton { height: 64px; background: var(--bg-3); border-radius: var(--radius); animation: pulse 1.5s infinite; }
        .log-panel { margin-top: 8px; border-top: 1px solid var(--border); padding-top: 12px; }
        .log-entry { font-size: 11px; color: var(--text-3); font-family: 'DM Mono', monospace; margin-bottom: 4px; }
        .main-panel { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .tabs { display: flex; gap: 4px; padding: 16px 24px 0; border-bottom: 1px solid var(--border); background: var(--bg-2); }
        .tab { background: none; border: none; color: var(--text-2); font-family: 'Syne', sans-serif; font-weight: 600; font-size: 14px; padding: 10px 16px; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.15s; margin-bottom: -1px; display: flex; align-items: center; gap: 8px; }
        .tab:hover:not(:disabled) { color: var(--text); }
        .tab.active { color: var(--accent-2); border-bottom-color: var(--accent); }
        .tab:disabled { opacity: 0.4; cursor: not-allowed; }
        .tab-count { background: var(--accent-glow); color: var(--accent-2); font-size: 11px; padding: 1px 7px; border-radius: 100px; font-family: 'DM Mono', monospace; }
        .chat-container { flex: 1; overflow-y: auto; padding: 24px; display: flex; flex-direction: column; }
        .chat-placeholder { display: flex; flex-direction: column; align-items: center; justify-content: center; flex: 1; color: var(--text-3); gap: 16px; padding: 60px 0; }
        .round-group { margin-bottom: 24px; }
        .round-divider { display: flex; align-items: center; gap: 12px; margin: 16px 0; color: var(--text-3); font-size: 12px; font-family: 'DM Mono', monospace; }
        .round-divider::before, .round-divider::after { content: ''; flex: 1; height: 1px; background: var(--border); }
        .message-bubble { display: flex; gap: 12px; margin-bottom: 14px; }
        .message-bubble.msg-error .msg-content { border-color: rgba(248,113,113,0.3); color: var(--red); font-style: italic; }
        .msg-avatar { width: 38px; height: 38px; border-radius: 10px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-size: 18px; border: 1px solid; margin-top: 2px; }
        .msg-body { flex: 1; }
        .msg-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; flex-wrap: wrap; }
        .msg-name { font-weight: 700; font-size: 14px; }
        .msg-role { font-size: 12px; color: var(--text-3); }
        .msg-stance { font-size: 11px; font-family: 'DM Mono', monospace; }
        .msg-content { background: var(--bg-3); border: 1px solid var(--border); border-radius: 4px 12px 12px 12px; padding: 12px 16px; font-size: 14px; line-height: 1.7; color: var(--text); }
        .thinking-wrap { display: flex; align-items: center; gap: 10px; color: var(--text-3); font-size: 13px; padding: 8px 0; }
        .thinking-emoji { font-size: 20px; }
        .typing-indicator { display: flex; gap: 4px; }
        .typing-indicator span { width: 6px; height: 6px; background: var(--text-3); border-radius: 50%; animation: pulse 1.2s ease infinite; }
        .typing-indicator span:nth-child(2) { animation-delay: 0.2s; }
        .typing-indicator span:nth-child(3) { animation-delay: 0.4s; }
        .report-container { flex: 1; overflow-y: auto; padding: 28px 32px; display: flex; flex-direction: column; gap: 24px; }
        .report-section h2 { font-size: 22px; font-weight: 800; margin-bottom: 12px; }
        .report-section h3 { font-size: 15px; font-weight: 700; color: var(--text-2); text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 12px; }
        .executive-summary { font-size: 16px; line-height: 1.8; background: var(--bg-3); border-left: 3px solid var(--accent); padding: 16px 20px; border-radius: 0 var(--radius) var(--radius) 0; }
        .sentiment-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
        .sentiment-card { background: var(--bg-3); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px; text-align: center; }
        .sentiment-val { font-family: 'Syne', sans-serif; font-size: 28px; font-weight: 800; color: var(--accent-2); }
        .sentiment-label { font-size: 12px; color: var(--text-3); margin-top: 4px; text-transform: capitalize; }
        .report-two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .report-list { list-style: none; display: flex; flex-direction: column; gap: 8px; }
        .report-list li { font-size: 14px; padding: 10px 14px; background: var(--bg-3); border: 1px solid var(--border); border-radius: var(--radius); border-left: 3px solid var(--green); }
        .report-list.conflict li { border-left-color: var(--red); }
        .report-list.recs { list-style: decimal inside; }
        .report-list.recs li { border-left-color: var(--accent); }
        .finding-card { background: var(--bg-3); border: 1px solid var(--border); border-radius: var(--radius); padding: 16px; margin-bottom: 10px; }
        .finding-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
        .finding-title { font-weight: 600; font-size: 14px; }
        .impact-badge { font-size: 11px; font-family: 'DM Mono', monospace; padding: 2px 10px; border-radius: 100px; }
        .impact-badge.alto { background: rgba(248,113,113,0.15); color: var(--red); }
        .impact-badge.médio { background: rgba(251,191,36,0.15); color: var(--yellow); }
        .impact-badge.baixo { background: rgba(52,211,153,0.12); color: var(--green); }
        .prediction-card { background: var(--bg-3); border: 1px solid var(--border); border-radius: var(--radius); padding: 14px 16px; margin-bottom: 10px; }
        .prediction-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-weight: 600; font-size: 14px; }
        .prob-badge { font-size: 11px; font-family: 'DM Mono', monospace; padding: 2px 10px; border-radius: 100px; }
        .prob-badge.alta { background: rgba(52,211,153,0.12); color: var(--green); }
        .prob-badge.média { background: rgba(251,191,36,0.12); color: var(--yellow); }
        .prob-badge.baixa { background: rgba(248,113,113,0.12); color: var(--red); }
        .prediction-reason { font-size: 13px; color: var(--text-2); line-height: 1.6; }
        .mono { font-family: 'DM Mono', monospace; }
      `}</style>
    </div>
  );
}

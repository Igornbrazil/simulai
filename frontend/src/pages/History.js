import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const STATUS_LABELS = {
  completed: { label: 'Concluída', color: 'var(--green)' },
  running: { label: 'Executando', color: 'var(--accent-2)' },
  error: { label: 'Erro', color: 'var(--red)' },
  pending: { label: 'Aguardando', color: 'var(--text-3)' },
};

export default function History() {
  const navigate = useNavigate();
  const [simulations, setSimulations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get(`${API}/simulations`)
      .then(r => setSimulations(r.data.simulations.reverse()))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="history-page">
      <div className="history-header">
        <h1>Histórico de Simulações</h1>
        <p>Todas as simulações desta sessão</p>
      </div>

      {loading && (
        <div className="loading-state">
          <div className="spinner-large" />
          <p>Carregando...</p>
        </div>
      )}

      {!loading && simulations.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <h3>Nenhuma simulação ainda</h3>
          <p>Crie sua primeira simulação na página inicial</p>
          <button className="cta-btn" onClick={() => navigate('/')}>
            ⚡ Nova Simulação
          </button>
        </div>
      )}

      <div className="sim-grid">
        {simulations.map(sim => {
          const st = STATUS_LABELS[sim.status] || STATUS_LABELS.pending;
          return (
            <div
              key={sim.id}
              className="sim-card"
              onClick={() => navigate(`/simulation/${sim.id}`)}
            >
              <div className="card-top">
                <div className="card-scenario">"{sim.scenario}"</div>
                <div className="card-status" style={{ color: st.color }}>● {st.label}</div>
              </div>
              <div className="card-meta">
                <span>👥 {sim.agents?.length || sim.config?.num_agents} agentes</span>
                <span>🔄 {sim.config?.num_rounds} rodadas</span>
                <span>💬 {sim.messages?.length || 0} msgs</span>
                <span className="card-date">{new Date(sim.created_at).toLocaleString('pt-BR')}</span>
              </div>
              {sim.report && (
                <div className="card-summary">{sim.report.executive_summary?.substring(0, 100)}...</div>
              )}
            </div>
          );
        })}
      </div>

      <style>{`
        .history-page { padding: 48px; }
        .history-header { margin-bottom: 32px; }
        .history-header h1 { font-size: 32px; font-weight: 800; margin-bottom: 8px; }
        .history-header p { color: var(--text-2); }
        .loading-state, .empty-state {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; gap: 16px; padding: 80px 0; color: var(--text-2);
        }
        .empty-icon { font-size: 48px; }
        .empty-state h3 { font-size: 20px; color: var(--text); }
        .spinner-large {
          width: 40px; height: 40px;
          border: 3px solid var(--bg-4);
          border-top-color: var(--accent);
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }
        .cta-btn {
          background: var(--accent); color: white; border: none;
          border-radius: var(--radius); padding: 12px 24px;
          font-family: 'Syne', sans-serif; font-weight: 700;
          cursor: pointer; margin-top: 8px;
        }
        .sim-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(380px, 1fr)); gap: 16px; }
        .sim-card {
          background: var(--bg-2); border: 1px solid var(--border);
          border-radius: var(--radius-lg); padding: 20px;
          cursor: pointer; transition: all 0.2s;
        }
        .sim-card:hover { border-color: var(--accent); transform: translateY(-2px); box-shadow: var(--shadow); }
        .card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; margin-bottom: 12px; }
        .card-scenario { font-weight: 600; font-size: 14px; line-height: 1.5; color: var(--text); flex: 1; }
        .card-status { font-size: 12px; font-family: 'DM Mono', monospace; flex-shrink: 0; }
        .card-meta {
          display: flex; flex-wrap: wrap; gap: 12px;
          font-size: 12px; color: var(--text-3); font-family: 'DM Mono', monospace;
        }
        .card-date { margin-left: auto; }
        .card-summary { margin-top: 12px; font-size: 13px; color: var(--text-2); line-height: 1.6; border-top: 1px solid var(--border); padding-top: 12px; }
      `}</style>
    </div>
  );
}

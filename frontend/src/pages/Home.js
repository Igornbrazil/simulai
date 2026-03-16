import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const EXAMPLES = [
  "Uma startup brasileira lança um app de pagamentos para comunidades de baixa renda",
  "O governo anuncia uma nova regulamentação sobre uso de IA no mercado de trabalho",
  "Uma grande empresa decide adotar semana de trabalho de 4 dias",
  "Uma cidade implementa tarifa zero no transporte público",
  "Um banco tradicional anuncia que vai abandonar agências físicas completamente",
];

export default function Home() {
  const navigate = useNavigate();
  const [scenario, setScenario] = useState('');
  const [numAgents, setNumAgents] = useState(5);
  const [numRounds, setNumRounds] = useState(3);
  const [provider, setProvider] = useState('ollama');
  const [model, setModel] = useState('llama3');
  const [apiKey, setApiKey] = useState('');
  const [providers, setProviders] = useState([]);
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    axios.get(`${API}/providers`).then(r => setProviders(r.data.providers)).catch(() => {});
  }, []);

  useEffect(() => {
    axios.get(`${API}/models/${provider}`).then(r => {
      setModels(r.data.models);
      setModel(r.data.models[0] || '');
    }).catch(() => {});
  }, [provider]);

  const handleSubmit = async () => {
    if (!scenario.trim()) return;
    setLoading(true);
    try {
      const res = await axios.post(`${API}/simulate`, {
        scenario,
        num_agents: numAgents,
        num_rounds: numRounds,
        provider,
        model,
        api_key: apiKey || undefined,
      });
      navigate(`/simulation/${res.data.simulation_id}`);
    } catch (e) {
      alert('Erro ao iniciar simulação: ' + (e.response?.data?.detail || e.message));
      setLoading(false);
    }
  };

  const currentProvider = providers.find(p => p.id === provider);

  return (
    <div className="home-page">
      <div className="home-header">
        <div className="header-badge">Motor de Simulação Multi-Agente</div>
        <h1 className="home-title">
          Simule qualquer<br />
          <span className="gradient-text">cenário do mundo real</span>
        </h1>
        <p className="home-desc">
          Descreva um cenário e observe como agentes com diferentes perspectivas, 
          personalidades e motivações debatem e evoluem suas posições.
        </p>
      </div>

      <div className="form-card">
        <div className="form-section">
          <label className="form-label">
            <span className="label-icon">🎯</span>
            Descreva o cenário
          </label>
          <textarea
            className="scenario-input"
            placeholder="Ex: Uma empresa de tecnologia anuncia que vai substituir 30% dos funcionários por IA..."
            value={scenario}
            onChange={e => setScenario(e.target.value)}
            rows={4}
          />
          <div className="examples-row">
            <span className="examples-label">Exemplos:</span>
            {EXAMPLES.map((ex, i) => (
              <button key={i} className="example-chip" onClick={() => setScenario(ex)}>
                {ex.substring(0, 40)}…
              </button>
            ))}
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">
              <span className="label-icon">👥</span>
              Número de agentes
            </label>
            <div className="slider-row">
              <input
                type="range" min={2} max={10} value={numAgents}
                onChange={e => setNumAgents(+e.target.value)}
                className="slider"
              />
              <span className="slider-value">{numAgents}</span>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">
              <span className="label-icon">🔄</span>
              Rodadas de debate
            </label>
            <div className="slider-row">
              <input
                type="range" min={1} max={5} value={numRounds}
                onChange={e => setNumRounds(+e.target.value)}
                className="slider"
              />
              <span className="slider-value">{numRounds}</span>
            </div>
          </div>
        </div>

        <div className="form-section">
          <label className="form-label">
            <span className="label-icon">🤖</span>
            Modelo de IA
          </label>
          <div className="provider-grid">
            {providers.map(p => (
              <button
                key={p.id}
                className={`provider-card ${provider === p.id ? 'selected' : ''}`}
                onClick={() => setProvider(p.id)}
              >
                <div className="provider-name">{p.name}</div>
                {p.id === 'ollama' && <div className="free-badge">GRÁTIS</div>}
              </button>
            ))}
          </div>
        </div>

        {models.length > 0 && (
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Modelo</label>
              <select className="select-input" value={model} onChange={e => setModel(e.target.value)}>
                {models.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            {currentProvider?.requires_key && (
              <div className="form-group">
                <label className="form-label">API Key</label>
                <input
                  type="password"
                  className="text-input"
                  placeholder="sk-..."
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        <button
          className={`run-button ${loading ? 'loading' : ''}`}
          onClick={handleSubmit}
          disabled={loading || !scenario.trim()}
        >
          {loading ? (
            <><span className="spinner" /> Iniciando simulação...</>
          ) : (
            <><span>⚡</span> Iniciar Simulação</>
          )}
        </button>
      </div>

      <style>{`
        .home-page {
          padding: 48px 48px 48px;
          max-width: 860px;
        }
        .home-header { margin-bottom: 40px; }
        .header-badge {
          display: inline-block;
          background: var(--accent-glow);
          border: 1px solid rgba(124,106,247,0.3);
          color: var(--accent-2);
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          padding: 4px 12px;
          border-radius: 100px;
          margin-bottom: 16px;
          letter-spacing: 0.05em;
        }
        .home-title {
          font-size: 42px;
          font-weight: 800;
          line-height: 1.1;
          margin-bottom: 16px;
        }
        .gradient-text {
          background: linear-gradient(135deg, var(--accent-2), #60a5fa, var(--green));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .home-desc {
          color: var(--text-2);
          font-size: 16px;
          max-width: 520px;
          line-height: 1.7;
        }
        .form-card {
          background: var(--bg-2);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: 32px;
          display: flex;
          flex-direction: column;
          gap: 28px;
          animation: fadeIn 0.5s ease;
        }
        .form-section { display: flex; flex-direction: column; gap: 12px; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
        .form-group { display: flex; flex-direction: column; gap: 10px; }
        .form-label {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-2);
          display: flex;
          align-items: center;
          gap: 6px;
          letter-spacing: 0.01em;
        }
        .label-icon { font-size: 15px; }
        .scenario-input {
          background: var(--bg-3);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          color: var(--text);
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          padding: 16px;
          resize: vertical;
          transition: border-color 0.2s;
          outline: none;
          line-height: 1.6;
        }
        .scenario-input:focus { border-color: var(--accent); }
        .scenario-input::placeholder { color: var(--text-3); }
        .examples-row {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          align-items: center;
        }
        .examples-label {
          font-size: 12px;
          color: var(--text-3);
          font-family: 'DM Mono', monospace;
        }
        .example-chip {
          background: var(--bg-3);
          border: 1px solid var(--border);
          border-radius: 100px;
          color: var(--text-2);
          font-size: 12px;
          padding: 4px 12px;
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
        }
        .example-chip:hover { border-color: var(--accent); color: var(--accent-2); }
        .slider-row { display: flex; align-items: center; gap: 14px; }
        .slider {
          flex: 1;
          accent-color: var(--accent);
          height: 4px;
        }
        .slider-value {
          width: 28px;
          text-align: center;
          font-family: 'DM Mono', monospace;
          font-size: 16px;
          font-weight: 500;
          color: var(--accent-2);
        }
        .provider-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 10px;
        }
        .provider-card {
          background: var(--bg-3);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 14px 16px;
          cursor: pointer;
          text-align: left;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-family: inherit;
        }
        .provider-card:hover { border-color: var(--border-bright); }
        .provider-card.selected {
          border-color: var(--accent);
          background: var(--accent-glow);
        }
        .provider-name { font-size: 13px; font-weight: 500; color: var(--text); }
        .free-badge {
          background: rgba(52, 211, 153, 0.15);
          color: var(--green);
          font-size: 10px;
          font-family: 'DM Mono', monospace;
          padding: 2px 8px;
          border-radius: 100px;
          border: 1px solid rgba(52,211,153,0.3);
        }
        .select-input, .text-input {
          background: var(--bg-3);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          color: var(--text);
          font-family: inherit;
          font-size: 14px;
          padding: 10px 14px;
          outline: none;
          width: 100%;
          transition: border-color 0.2s;
        }
        .select-input:focus, .text-input:focus { border-color: var(--accent); }
        .run-button {
          background: var(--accent);
          color: white;
          border: none;
          border-radius: var(--radius);
          padding: 16px 28px;
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          font-weight: 700;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          transition: all 0.2s;
          box-shadow: 0 0 30px var(--accent-glow);
          letter-spacing: 0.01em;
        }
        .run-button:hover:not(:disabled) {
          background: var(--accent-2);
          transform: translateY(-1px);
          box-shadow: 0 0 40px var(--accent-glow);
        }
        .run-button:disabled { opacity: 0.6; cursor: not-allowed; transform: none; }
        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid rgba(255,255,255,0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          display: inline-block;
        }
      `}</style>
    </div>
  );
}

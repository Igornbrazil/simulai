import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import styled from './Layout.module.css';

const NAV = [
  { path: '/', icon: '⚡', label: 'Nova Simulação' },
  { path: '/history', icon: '📁', label: 'Histórico' },
];

export default function Layout({ children }) {
  const location = useLocation();

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-icon">S</div>
          <div>
            <div className="logo-name">SimulAI</div>
            <div className="logo-sub">Motor de Agentes</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="version-badge">v1.0.0</div>
          <div className="footer-hint">Rodando localmente</div>
        </div>
      </aside>

      <main className="main-content">
        {children}
      </main>

      <style>{`
        .layout {
          display: flex;
          min-height: 100vh;
        }
        .sidebar {
          width: 220px;
          flex-shrink: 0;
          background: var(--bg-2);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          padding: 24px 16px;
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
        }
        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 36px;
          padding: 0 4px;
        }
        .logo-icon {
          width: 36px;
          height: 36px;
          background: var(--accent);
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-family: 'Syne', sans-serif;
          font-weight: 800;
          font-size: 18px;
          color: white;
          box-shadow: 0 0 20px var(--accent-glow);
          flex-shrink: 0;
        }
        .logo-name {
          font-family: 'Syne', sans-serif;
          font-weight: 700;
          font-size: 16px;
        }
        .logo-sub {
          font-size: 11px;
          color: var(--text-3);
          font-family: 'DM Mono', monospace;
        }
        .sidebar-nav {
          display: flex;
          flex-direction: column;
          gap: 4px;
          flex: 1;
        }
        .nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: var(--radius);
          text-decoration: none;
          color: var(--text-2);
          font-size: 14px;
          font-weight: 500;
          transition: all 0.15s ease;
        }
        .nav-item:hover {
          background: var(--bg-3);
          color: var(--text);
        }
        .nav-item.active {
          background: var(--accent-glow);
          color: var(--accent-2);
          border: 1px solid rgba(124,106,247,0.2);
        }
        .nav-icon { font-size: 16px; }
        .sidebar-footer {
          padding: 12px 4px 0;
          border-top: 1px solid var(--border);
        }
        .version-badge {
          font-family: 'DM Mono', monospace;
          font-size: 11px;
          color: var(--text-3);
          margin-bottom: 4px;
        }
        .footer-hint {
          font-size: 11px;
          color: var(--green);
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .footer-hint::before {
          content: '';
          width: 6px;
          height: 6px;
          background: var(--green);
          border-radius: 50%;
          display: inline-block;
          animation: pulse 2s infinite;
        }
        .main-content {
          margin-left: 220px;
          flex: 1;
          min-height: 100vh;
        }
      `}</style>
    </div>
  );
}

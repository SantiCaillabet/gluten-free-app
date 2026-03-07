import { NavLink, useLocation } from 'react-router-dom';
import { MapPin, BookOpen, Sparkles, Wheat, ChevronRight } from 'lucide-react';
import './Layout.css';

const navItems = [
  { to: '/', label: 'Inicio', icon: Wheat, exact: true },
  { to: '/restaurantes', label: 'Restaurantes', icon: MapPin },
  { to: '/recetas', label: 'Recetas', icon: BookOpen },
  { to: '/asistente', label: 'Asistente IA', icon: Sparkles },
];

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🌾</div>
        <div>
          <div className="sidebar-logo-title">GlutenFree</div>
          <div className="sidebar-logo-sub">Tu guía sin TACC</div>
        </div>
      </div>
      <nav className="sidebar-nav">
        {navItems.map(({ to, label, icon: Icon, exact }) => (
          <NavLink
            key={to}
            to={to}
            end={exact}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
          >
            <Icon size={18} />
            <span>{label}</span>
            <ChevronRight size={14} className="sidebar-link-arrow" />
          </NavLink>
        ))}
      </nav>
      <div className="sidebar-footer">
        <div className="sidebar-badge">
          <span>🌱</span>
          <span>100% Sin TACC</span>
        </div>
      </div>
    </aside>
  );
}

export function MobileNav() {
  return (
    <nav className="mobile-nav">
      {navItems.map(({ to, label, icon: Icon, exact }) => (
        <NavLink
          key={to}
          to={to}
          end={exact}
          className={({ isActive }) => `mobile-nav-link ${isActive ? 'active' : ''}`}
        >
          <Icon size={20} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

export function ToastContainer({ toasts }) {
  const icons = { success: '✓', error: '✕', info: 'ℹ' };
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span>{icons[t.type]}</span>
          {t.message}
        </div>
      ))}
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="page-header-sub">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function LoadingSpinner({ fullPage }) {
  if (fullPage) return (
    <div className="loading-full">
      <div className="spinner" />
      <p>Cargando...</p>
    </div>
  );
  return <div className="spinner" />;
}

export function ConfirmDialog({ message, onConfirm, onCancel }) {
  return (
    <div className="modal-overlay" onClick={onCancel}>
      <div className="modal" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
        <div className="modal-body" style={{ padding: '32px 28px' }}>
          <div style={{ fontSize: '2.5rem', marginBottom: 12, textAlign: 'center' }}>⚠️</div>
          <h3 style={{ textAlign: 'center', marginBottom: 8, fontFamily: 'var(--font-display)' }}>¿Estás seguro?</h3>
          <p style={{ textAlign: 'center', color: 'var(--mid-gray)', fontSize: '0.9rem' }}>{message}</p>
        </div>
        <div className="modal-footer" style={{ justifyContent: 'center', gap: 12 }}>
          <button className="btn btn-secondary" onClick={onCancel}>Cancelar</button>
          <button className="btn btn-danger" onClick={onConfirm}>Eliminar</button>
        </div>
      </div>
    </div>
  );
}

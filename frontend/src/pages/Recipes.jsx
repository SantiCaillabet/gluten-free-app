import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Search, Clock, Trash2, Edit } from 'lucide-react';
import { api, getPhotoUrl, DIFFICULTY_LEVELS, RECIPE_CATEGORIES } from '../utils/api';
import { useToast } from '../hooks/useToast';
import { ToastContainer, PageHeader, LoadingSpinner, ConfirmDialog } from '../components/layout/Layout.jsx';
import RecipeForm from '../components/recipes/RecipeForm.jsx';
import './Recipes.css';

export default function Recipes() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [filters, setFilters] = useState({ search: '', difficulty: '', category: '', sort: 'newest' });
  const { toasts, toast } = useToast();
  const navigate = useNavigate();

  const loadRecipes = useCallback(async () => {
    try {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.difficulty) params.difficulty = filters.difficulty;
      if (filters.category) params.category = filters.category;
      if (filters.sort) params.sort = filters.sort;
      const data = await api.recipes.list(params);
      setRecipes(data.data);
    } catch (e) {
      toast.error('Error cargando recetas');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(loadRecipes, 300);
    return () => clearTimeout(timer);
  }, [loadRecipes]);

  async function handleDelete() {
    try {
      await api.recipes.delete(deleteId);
      toast.success('Receta eliminada');
      setDeleteId(null);
      loadRecipes();
    } catch (e) {
      toast.error(e.message);
    }
  }

  const diffColor = { 'fácil': 'green', 'medio': 'yellow', 'difícil': 'red' };

  return (
    <div className="page-content">
      <div className="page-container">
        <PageHeader
          title="Recetas 👨‍🍳"
          subtitle={`${recipes.length} receta${recipes.length !== 1 ? 's' : ''} guardada${recipes.length !== 1 ? 's' : ''}`}
          action={
            <button className="btn btn-primary" onClick={() => { setEditingId(null); setShowForm(true); }}>
              <Plus size={16} /> Nueva receta
            </button>
          }
        />

        {/* Filters */}
        <div className="filter-bar">
          <div className="search-bar" style={{ flex: '1 1 200px' }}>
            <Search size={16} className="search-bar-icon" />
            <input
              className="form-input"
              placeholder="Buscar recetas..."
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            />
          </div>
          <select className="filter-select" value={filters.difficulty} onChange={e => setFilters(f => ({ ...f, difficulty: e.target.value }))}>
            <option value="">Todas las dificultades</option>
            {DIFFICULTY_LEVELS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
          </select>
          <select className="filter-select" value={filters.category} onChange={e => setFilters(f => ({ ...f, category: e.target.value }))}>
            <option value="">Todas las categorías</option>
            {RECIPE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select className="filter-select" value={filters.sort} onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))}>
            <option value="newest">Más recientes</option>
            <option value="name_asc">A-Z</option>
            <option value="prep_time_asc">Más rápidas</option>
          </select>
        </div>

        {loading ? (
          <div className="loading-full"><LoadingSpinner /></div>
        ) : recipes.length === 0 ? (
          <div className="empty-state fade-in">
            <div className="empty-state-icon">👨‍🍳</div>
            <h3>No hay recetas</h3>
            <p>
              {filters.search || filters.difficulty || filters.category
                ? 'No encontramos recetas con esos filtros'
                : 'Empezá guardando tus recetas favoritas sin gluten'}
            </p>
            {!filters.search && !filters.difficulty && (
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowForm(true)}>
                <Plus size={16} /> Agregar primera receta
              </button>
            )}
          </div>
        ) : (
          <div className="grid-3 fade-in">
            {recipes.map(r => (
              <div key={r.id} className="card recipe-card">
                <Link to={`/recetas/${r.id}`} className="recipe-card-photo">
                  {r.cover_photo
                    ? <img src={getPhotoUrl('recipes', r.cover_photo)} alt={r.name} />
                    : <div className="recipe-card-placeholder">👨‍🍳</div>
                  }
                  <span className={`badge badge-${diffColor[r.difficulty] || 'gray'} recipe-card-badge`}>
                    {r.difficulty}
                  </span>
                </Link>
                <div className="recipe-card-body">
                  <Link to={`/recetas/${r.id}`}>
                    <h3 className="recipe-card-name">{r.name}</h3>
                  </Link>
                  <div className="recipe-card-meta">
                    {r.prep_time && <span><Clock size={11} /> {r.prep_time} min</span>}
                    {r.category && <span className="recipe-card-category">{r.category}</span>}
                    {r.servings && <span>👥 {r.servings} porciones</span>}
                  </div>
                  <div className="recipe-card-footer">
                    <div style={{ fontSize: '0.78rem', color: 'var(--mid-gray)' }}>
                      {new Date(r.created_at).toLocaleDateString('es-AR')}
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button className="btn btn-ghost" onClick={() => { setEditingId(r.id); setShowForm(true); }}><Edit size={14} /></button>
                      <button className="btn btn-ghost" onClick={() => setDeleteId(r.id)} style={{ color: 'var(--red)' }}><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <RecipeForm
          recipeId={editingId}
          onClose={() => { setShowForm(false); setEditingId(null); }}
          onSave={() => { setShowForm(false); setEditingId(null); loadRecipes(); }}
          toast={toast}
        />
      )}

      {deleteId && (
        <ConfirmDialog
          message="¿Querés eliminar esta receta? Esta acción no se puede deshacer."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}

      <ToastContainer toasts={toasts} />
    </div>
  );
}

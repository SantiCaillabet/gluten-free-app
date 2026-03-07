import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, Plus, Search, List, Map as MapIcon, Star, Trash2, Edit, Filter } from 'lucide-react';
import { api, getPhotoUrl, GLUTEN_LEVELS } from '../utils/api';
import { useToast } from '../hooks/useToast';
import { ToastContainer, PageHeader, LoadingSpinner, ConfirmDialog } from '../components/layout/Layout.jsx';
import RestaurantForm from '../components/restaurants/RestaurantForm.jsx';
import RestaurantMap from '../components/restaurants/RestaurantMap.jsx';
import './Restaurants.css';

export default function Restaurants() {
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [filters, setFilters] = useState({ search: '', gluten_level: '', sort: 'newest' });
  const { toasts, toast } = useToast();
  const navigate = useNavigate();

  const loadRestaurants = useCallback(async () => {
    try {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.gluten_level) params.gluten_level = filters.gluten_level;
      if (filters.sort) params.sort = filters.sort;
      const data = await api.restaurants.list(params);
      setRestaurants(data.data);
    } catch (e) {
      toast.error('Error cargando restaurantes');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    const timer = setTimeout(loadRestaurants, 300);
    return () => clearTimeout(timer);
  }, [loadRestaurants]);

  async function handleDelete() {
    try {
      await api.restaurants.delete(deleteId);
      toast.success('Restaurante eliminado');
      setDeleteId(null);
      loadRestaurants();
    } catch (e) {
      toast.error(e.message);
    }
  }

  const getGlutenInfo = (level) => GLUTEN_LEVELS.find(g => g.value === level) || { label: level, color: 'gray' };

  const renderStars = (rating) =>
    Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < Math.round(rating) ? 'star' : 'star star-empty'}>★</span>
    ));

  return (
    <div className="page-content">
      <div className="page-container">
        <PageHeader
          title="Restaurantes 🗺️"
          subtitle={`${restaurants.length} lugar${restaurants.length !== 1 ? 'es' : ''} guardado${restaurants.length !== 1 ? 's' : ''}`}
          action={
            <button className="btn btn-primary" onClick={() => { setEditingId(null); setShowForm(true); }}>
              <Plus size={16} /> Agregar restaurante
            </button>
          }
        />

        {/* Filter bar */}
        <div className="filter-bar">
          <div className="search-bar" style={{ flex: '1 1 200px' }}>
            <Search size={16} className="search-bar-icon" />
            <input
              className="form-input"
              placeholder="Buscar por nombre, ciudad..."
              value={filters.search}
              onChange={e => setFilters(f => ({ ...f, search: e.target.value }))}
            />
          </div>
          <select
            className="filter-select"
            value={filters.gluten_level}
            onChange={e => setFilters(f => ({ ...f, gluten_level: e.target.value }))}
          >
            <option value="">Todos los niveles</option>
            {GLUTEN_LEVELS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
          </select>
          <select
            className="filter-select"
            value={filters.sort}
            onChange={e => setFilters(f => ({ ...f, sort: e.target.value }))}
          >
            <option value="newest">Más recientes</option>
            <option value="oldest">Más antiguos</option>
            <option value="rating_desc">Mejor calificados</option>
            <option value="name_asc">A-Z</option>
          </select>
          <div className="view-toggle">
            <button
              className={`btn btn-ghost ${view === 'list' ? 'view-toggle-active' : ''}`}
              onClick={() => setView('list')} title="Vista lista"
            ><List size={18} /></button>
            <button
              className={`btn btn-ghost ${view === 'map' ? 'view-toggle-active' : ''}`}
              onClick={() => setView('map')} title="Vista mapa"
            ><MapIcon size={18} /></button>
          </div>
        </div>

        {loading ? (
          <div className="loading-full"><LoadingSpinner /></div>
        ) : view === 'map' ? (
          <RestaurantMap restaurants={restaurants} onSelect={id => navigate(`/restaurantes/${id}`)} />
        ) : restaurants.length === 0 ? (
          <div className="empty-state fade-in">
            <div className="empty-state-icon">🗺️</div>
            <h3>No hay restaurantes</h3>
            <p>
              {filters.search || filters.gluten_level
                ? 'No se encontraron resultados para tu búsqueda'
                : 'Empezá agregando tus restaurantes sin gluten favoritos'}
            </p>
            {!filters.search && !filters.gluten_level && (
              <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowForm(true)}>
                <Plus size={16} /> Agregar primer restaurante
              </button>
            )}
          </div>
        ) : (
          <div className="grid-2 fade-in">
            {restaurants.map(r => {
              const gluten = getGlutenInfo(r.gluten_level);
              return (
                <div key={r.id} className="card restaurant-card">
                  <Link to={`/restaurantes/${r.id}`} className="restaurant-card-photo">
                    {r.cover_photo
                      ? <img src={getPhotoUrl('restaurants', r.cover_photo)} alt={r.name} />
                      : <div className="restaurant-card-placeholder">🍽️</div>
                    }
                    <span className={`badge badge-${gluten.color} restaurant-card-gluten-badge`}>
                      {gluten.label}
                    </span>
                    {r.price_range && (
                      <span className="restaurant-card-price">{r.price_range}</span>
                    )}
                  </Link>
                  <div className="restaurant-card-body">
                    <Link to={`/restaurantes/${r.id}`}>
                      <h3 className="restaurant-card-name">{r.name}</h3>
                    </Link>
                    <div className="restaurant-card-location">
                      <MapPin size={12} />
                      {r.city}, {r.country}
                      {r.food_type && <> · <span className="restaurant-card-type">{r.food_type}</span></>}
                    </div>
                    <div className="restaurant-card-footer">
                      <div className="restaurant-card-stars">{renderStars(r.rating)}</div>
                      <div className="restaurant-card-actions">
                        <button
                          className="btn btn-ghost"
                          title="Editar"
                          onClick={() => { setEditingId(r.id); setShowForm(true); }}
                        ><Edit size={15} /></button>
                        <button
                          className="btn btn-ghost"
                          title="Eliminar"
                          onClick={() => setDeleteId(r.id)}
                          style={{ color: 'var(--red)' }}
                        ><Trash2 size={15} /></button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {showForm && (
        <RestaurantForm
          restaurantId={editingId}
          onClose={() => { setShowForm(false); setEditingId(null); }}
          onSave={() => { setShowForm(false); setEditingId(null); loadRestaurants(); }}
          toast={toast}
        />
      )}

      {deleteId && (
        <ConfirmDialog
          message="¿Querés eliminar este restaurante? Esta acción no se puede deshacer."
          onConfirm={handleDelete}
          onCancel={() => setDeleteId(null)}
        />
      )}

      <ToastContainer toasts={toasts} />
    </div>
  );
}

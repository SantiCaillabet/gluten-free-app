import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, MapPin, Globe, Phone, Clock, ExternalLink } from 'lucide-react';
import { api, getPhotoUrl, GLUTEN_LEVELS } from '../utils/api';
import { useToast } from '../hooks/useToast';
import { ToastContainer, LoadingSpinner, ConfirmDialog } from '../components/layout/Layout.jsx';
import RestaurantForm from '../components/restaurants/RestaurantForm.jsx';
import './Restaurants.css';

export default function RestaurantDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);
  const { toasts, toast } = useToast();

  async function load() {
    try {
      const data = await api.restaurants.get(id);
      setRestaurant(data.data);
    } catch {
      toast.error('Restaurante no encontrado');
      navigate('/restaurantes');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function handleDelete() {
    try {
      await api.restaurants.delete(id);
      toast.success('Restaurante eliminado');
      navigate('/restaurantes');
    } catch (e) {
      toast.error(e.message);
    }
  }

  if (loading) return <div className="loading-full"><LoadingSpinner /></div>;
  if (!restaurant) return null;

  const gluten = GLUTEN_LEVELS.find(g => g.value === restaurant.gluten_level) || { label: restaurant.gluten_level, color: 'gray' };
  const photos = restaurant.photos || [];
  const renderStars = (r) => Array.from({ length: 5 }, (_, i) => (
    <span key={i} className={i < Math.round(r) ? 'star' : 'star star-empty'} style={{ fontSize: '1.2rem' }}>★</span>
  ));

  return (
    <div className="page-content">
      <div className="page-container">
        <div className="restaurant-detail">
          {/* Back + Actions */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <Link to="/restaurantes" className="btn btn-ghost">
              <ArrowLeft size={16} /> Volver
            </Link>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowEdit(true)}>
                <Edit size={14} /> Editar
              </button>
              <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(true)}>
                <Trash2 size={14} /> Eliminar
              </button>
            </div>
          </div>

          {/* Hero photo */}
          <div className="restaurant-detail-hero">
            {photos.length > 0
              ? <img src={getPhotoUrl('restaurants', photos[activePhoto]?.filename)} alt={restaurant.name} />
              : <div className="restaurant-detail-hero-placeholder">🍽️</div>
            }
            <div className="restaurant-detail-badges">
              <span className={`badge badge-${gluten.color}`}>{gluten.label}</span>
              {restaurant.price_range && <span className="badge badge-gray">{restaurant.price_range}</span>}
              {restaurant.food_type && <span className="badge badge-blue">{restaurant.food_type}</span>}
            </div>
          </div>

          {/* Photo thumbnails */}
          {photos.length > 1 && (
            <div className="photo-grid" style={{ marginTop: -10, marginBottom: 20 }}>
              {photos.map((ph, i) => (
                <div
                  key={ph.id}
                  className="photo-thumb"
                  style={{ cursor: 'pointer', outline: i === activePhoto ? '2px solid var(--sage)' : 'none', borderRadius: 8 }}
                  onClick={() => setActivePhoto(i)}
                >
                  <img src={getPhotoUrl('restaurants', ph.filename)} alt="" />
                </div>
              ))}
            </div>
          )}

          {/* Title */}
          <div className="restaurant-detail-title-section">
            <div>
              <h1 style={{ marginBottom: 6 }}>{restaurant.name}</h1>
              <div className="restaurant-detail-meta">
                <span className="restaurant-detail-meta-item"><MapPin size={13} /> {restaurant.city}, {restaurant.country}</span>
                {restaurant.address && <span className="restaurant-detail-meta-item">📍 {restaurant.address}</span>}
                {restaurant.phone && <span className="restaurant-detail-meta-item"><Phone size={13} /> {restaurant.phone}</span>}
                {restaurant.website && (
                  <a href={restaurant.website} target="_blank" rel="noreferrer" className="restaurant-detail-meta-item" style={{ color: 'var(--blue)', textDecoration: 'underline' }}>
                    <Globe size={13} /> Sitio web <ExternalLink size={11} />
                  </a>
                )}
              </div>
            </div>
            <div className="restaurant-detail-stars">{renderStars(restaurant.rating)}</div>
          </div>

          {/* Info sections */}
          {restaurant.menu && (
            <div className="detail-section">
              <div className="detail-section-title">🍴 Menú / Platos</div>
              <div className="detail-section-content">{restaurant.menu}</div>
            </div>
          )}

          {restaurant.notes && (
            <div className="detail-section">
              <div className="detail-section-title">📝 Notas personales</div>
              <div className="detail-section-content">{restaurant.notes}</div>
            </div>
          )}

          {(restaurant.latitude && restaurant.longitude) && (
            <div className="detail-section">
              <div className="detail-section-title">📍 Ubicación</div>
              <a
                href={`https://www.google.com/maps?q=${restaurant.latitude},${restaurant.longitude}`}
                target="_blank"
                rel="noreferrer"
                className="btn btn-secondary btn-sm"
              >
                <MapPin size={14} /> Ver en Google Maps
              </a>
            </div>
          )}

          <div className="detail-section" style={{ background: 'var(--cream)', border: 'none' }}>
            <div className="detail-section-title">Información</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 20, fontSize: '0.85rem', color: 'var(--mid-gray)' }}>
              <span><Clock size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> Agregado: {new Date(restaurant.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>

      {showEdit && (
        <RestaurantForm
          restaurantId={id}
          onClose={() => setShowEdit(false)}
          onSave={() => { setShowEdit(false); load(); }}
          toast={toast}
        />
      )}

      {showDelete && (
        <ConfirmDialog
          message={`¿Eliminar "${restaurant.name}"? Esta acción no se puede deshacer.`}
          onConfirm={handleDelete}
          onCancel={() => setShowDelete(false)}
        />
      )}

      <ToastContainer toasts={toasts} />
    </div>
  );
}

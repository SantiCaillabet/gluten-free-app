import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, BookOpen, Sparkles, TrendingUp, Clock, Star } from 'lucide-react';
import { api, getPhotoUrl, GLUTEN_LEVELS } from '../utils/api';
import './Dashboard.css';

export default function Dashboard() {
  const [stats, setStats] = useState({ restaurants: 0, recipes: 0 });
  const [recentRestaurants, setRecentRestaurants] = useState([]);
  const [recentRecipes, setRecentRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [rests, recs] = await Promise.all([
          api.restaurants.list({ sort: 'newest' }),
          api.recipes.list({ sort: 'newest' }),
        ]);
        setStats({ restaurants: rests.total, recipes: recs.total });
        setRecentRestaurants(rests.data.slice(0, 4));
        setRecentRecipes(recs.data.slice(0, 4));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const getGlutenBadge = (level) => {
    const found = GLUTEN_LEVELS.find(g => g.value === level);
    return found || { label: level, color: 'gray' };
  };

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < Math.round(rating) ? 'star' : 'star star-empty'}>★</span>
    ));
  };

  return (
    <div className="dashboard page-content">
      <div className="page-container">
        {/* Hero */}
        <div className="dashboard-hero fade-in">
          <div className="dashboard-hero-content">
            <div className="dashboard-greeting">Buenos días 🌿</div>
            <h1>Tu guía personal<br /><em>sin gluten</em></h1>
            <p>Todos tus restaurantes y recetas favoritas, organizados en un solo lugar.</p>
            <div className="dashboard-hero-actions">
              <Link to="/restaurantes" className="btn btn-primary btn-lg">
                <MapPin size={18} /> Ver restaurantes
              </Link>
              <Link to="/recetas" className="btn btn-secondary btn-lg">
                <BookOpen size={18} /> Ver recetas
              </Link>
            </div>
          </div>
          <div className="dashboard-hero-decoration">
            <div className="hero-circle hero-circle-1">🌾</div>
            <div className="hero-circle hero-circle-2">🥗</div>
            <div className="hero-circle hero-circle-3">🍳</div>
          </div>
        </div>

        {/* Stats */}
        <div className="stats-grid fade-in">
          <Link to="/restaurantes" className="stat-card">
            <div className="stat-icon stat-icon-green"><MapPin size={22} /></div>
            <div>
              <div className="stat-number">{stats.restaurants}</div>
              <div className="stat-label">Restaurantes guardados</div>
            </div>
            <TrendingUp size={16} className="stat-trend" />
          </Link>
          <Link to="/recetas" className="stat-card">
            <div className="stat-icon stat-icon-earth"><BookOpen size={22} /></div>
            <div>
              <div className="stat-number">{stats.recipes}</div>
              <div className="stat-label">Recetas guardadas</div>
            </div>
            <TrendingUp size={16} className="stat-trend" />
          </Link>
          <Link to="/asistente" className="stat-card stat-card-ai">
            <div className="stat-icon stat-icon-gold"><Sparkles size={22} /></div>
            <div>
              <div className="stat-number">IA</div>
              <div className="stat-label">Asistente de cocina</div>
            </div>
          </Link>
        </div>

        {/* Recent restaurants */}
        {recentRestaurants.length > 0 && (
          <section className="dashboard-section fade-in">
            <div className="section-header">
              <div>
                <h2>Restaurantes recientes</h2>
                <p className="section-sub">Tus últimos lugares agregados</p>
              </div>
              <Link to="/restaurantes" className="btn btn-secondary btn-sm">Ver todos →</Link>
            </div>
            <div className="grid-2">
              {recentRestaurants.map(r => {
                const gluten = getGlutenBadge(r.gluten_level);
                return (
                  <Link key={r.id} to={`/restaurantes/${r.id}`} className="card dashboard-item-card">
                    <div className="dashboard-item-photo">
                      {r.cover_photo
                        ? <img src={getPhotoUrl('restaurants', r.cover_photo)} alt={r.name} />
                        : <div className="dashboard-item-placeholder">🍽️</div>
                      }
                      <span className={`badge badge-${gluten.color} dashboard-item-badge`}>
                        {gluten.label}
                      </span>
                    </div>
                    <div className="dashboard-item-info">
                      <h3>{r.name}</h3>
                      <div className="dashboard-item-meta">
                        <MapPin size={12} /> {r.city}, {r.country}
                        {r.food_type && <> · {r.food_type}</>}
                      </div>
                      <div className="dashboard-item-stars">{renderStars(r.rating)}</div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Recent recipes */}
        {recentRecipes.length > 0 && (
          <section className="dashboard-section fade-in">
            <div className="section-header">
              <div>
                <h2>Recetas recientes</h2>
                <p className="section-sub">Tus últimas recetas guardadas</p>
              </div>
              <Link to="/recetas" className="btn btn-secondary btn-sm">Ver todas →</Link>
            </div>
            <div className="grid-3">
              {recentRecipes.map(r => (
                <Link key={r.id} to={`/recetas/${r.id}`} className="card dashboard-item-card">
                  <div className="dashboard-item-photo">
                    {r.cover_photo
                      ? <img src={getPhotoUrl('recipes', r.cover_photo)} alt={r.name} />
                      : <div className="dashboard-item-placeholder">👨‍🍳</div>
                    }
                    <span className={`badge badge-${r.difficulty === 'fácil' ? 'green' : r.difficulty === 'difícil' ? 'red' : 'yellow'} dashboard-item-badge`}>
                      {r.difficulty}
                    </span>
                  </div>
                  <div className="dashboard-item-info">
                    <h3>{r.name}</h3>
                    {r.prep_time && (
                      <div className="dashboard-item-meta">
                        <Clock size={12} /> {r.prep_time} min{r.category && ` · ${r.category}`}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Empty state */}
        {!loading && stats.restaurants === 0 && stats.recipes === 0 && (
          <div className="dashboard-welcome fade-in">
            <div style={{ fontSize: '4rem', marginBottom: 16 }}>🌱</div>
            <h2>¡Empezá a construir tu guía!</h2>
            <p>Agregá tus restaurantes favoritos sin gluten y guardá tus mejores recetas.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 24, flexWrap: 'wrap' }}>
              <Link to="/restaurantes" className="btn btn-primary">
                <MapPin size={16} /> Agregar restaurante
              </Link>
              <Link to="/recetas" className="btn btn-secondary">
                <BookOpen size={16} /> Agregar receta
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

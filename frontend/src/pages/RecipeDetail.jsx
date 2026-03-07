import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Clock, Users, ChefHat } from 'lucide-react';
import { api, getPhotoUrl } from '../utils/api';
import { useToast } from '../hooks/useToast';
import { ToastContainer, LoadingSpinner, ConfirmDialog } from '../components/layout/Layout.jsx';
import RecipeForm from '../components/recipes/RecipeForm.jsx';
import './Recipes.css';

export default function RecipeDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [activePhoto, setActivePhoto] = useState(0);
  const { toasts, toast } = useToast();

  async function load() {
    try {
      const data = await api.recipes.get(id);
      setRecipe(data.data);
    } catch {
      toast.error('Receta no encontrada');
      navigate('/recetas');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [id]);

  async function handleDelete() {
    try {
      await api.recipes.delete(id);
      navigate('/recetas');
    } catch (e) {
      toast.error(e.message);
    }
  }

  if (loading) return <div className="loading-full"><LoadingSpinner /></div>;
  if (!recipe) return null;

  const photos = recipe.photos || [];
  const ingredients = recipe.ingredients_list || (typeof recipe.ingredients === 'string'
    ? (recipe.ingredients.startsWith('[') ? JSON.parse(recipe.ingredients) : recipe.ingredients.split('\n').filter(Boolean))
    : []);
  const steps = recipe.instructions_list || (typeof recipe.instructions === 'string'
    ? (recipe.instructions.startsWith('[') ? JSON.parse(recipe.instructions) : recipe.instructions.split('\n').filter(Boolean))
    : []);

  const diffColor = { 'fácil': 'green', 'medio': 'yellow', 'difícil': 'red' };

  return (
    <div className="page-content">
      <div className="page-container">
        <div className="recipe-detail">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <Link to="/recetas" className="btn btn-ghost"><ArrowLeft size={16} /> Volver</Link>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => setShowEdit(true)}><Edit size={14} /> Editar</button>
              <button className="btn btn-danger btn-sm" onClick={() => setShowDelete(true)}><Trash2 size={14} /></button>
            </div>
          </div>

          {/* Hero */}
          <div className="recipe-detail-hero">
            {photos.length > 0
              ? <img src={getPhotoUrl('recipes', photos[activePhoto]?.filename)} alt={recipe.name} />
              : <div className="recipe-detail-hero-placeholder">👨‍🍳</div>
            }
          </div>

          {photos.length > 1 && (
            <div className="photo-grid" style={{ marginTop: -8, marginBottom: 20 }}>
              {photos.map((ph, i) => (
                <div key={ph.id} className="photo-thumb" style={{ cursor: 'pointer', outline: i === activePhoto ? '2px solid var(--sage)' : 'none', borderRadius: 8 }} onClick={() => setActivePhoto(i)}>
                  <img src={getPhotoUrl('recipes', ph.filename)} alt="" />
                </div>
              ))}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <div>
              <h1 style={{ marginBottom: 8 }}>{recipe.name}</h1>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <span className={`badge badge-${diffColor[recipe.difficulty] || 'gray'}`}>{recipe.difficulty}</span>
                {recipe.category && <span className="badge badge-blue">{recipe.category}</span>}
                <span className="badge badge-green">🌾 Sin gluten</span>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="recipe-stats">
            {recipe.prep_time && (
              <div className="recipe-stat">
                <div className="recipe-stat-value">{recipe.prep_time}</div>
                <div className="recipe-stat-label">min prep</div>
              </div>
            )}
            {recipe.cook_time && (
              <div className="recipe-stat">
                <div className="recipe-stat-value">{recipe.cook_time}</div>
                <div className="recipe-stat-label">min cocción</div>
              </div>
            )}
            {recipe.prep_time && recipe.cook_time && (
              <div className="recipe-stat">
                <div className="recipe-stat-value">{parseInt(recipe.prep_time) + parseInt(recipe.cook_time)}</div>
                <div className="recipe-stat-label">min total</div>
              </div>
            )}
            {recipe.servings && (
              <div className="recipe-stat">
                <div className="recipe-stat-value">{recipe.servings}</div>
                <div className="recipe-stat-label">porciones</div>
              </div>
            )}
          </div>

          {/* Ingredients */}
          {ingredients.length > 0 && (
            <div className="detail-section">
              <div className="detail-section-title">🛒 Ingredientes ({ingredients.length})</div>
              <div className="recipe-ingredients">
                {ingredients.map((ing, i) => (
                  <div key={i} className="recipe-ingredient">{ing}</div>
                ))}
              </div>
            </div>
          )}

          {/* Steps */}
          {steps.length > 0 && (
            <div className="detail-section">
              <div className="detail-section-title">📋 Instrucciones</div>
              <ol className="recipe-instructions">
                {steps.map((step, i) => (
                  <li key={i} className="recipe-step">
                    <div className="recipe-step-num">{i + 1}</div>
                    <div className="recipe-step-text">{step}</div>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {recipe.notes && (
            <div className="detail-section" style={{ background: 'var(--gold-light)', borderColor: 'rgba(201,168,76,0.3)' }}>
              <div className="detail-section-title">💡 Notas y tips</div>
              <div className="detail-section-content">{recipe.notes}</div>
            </div>
          )}
        </div>
      </div>

      {showEdit && (
        <RecipeForm recipeId={id} onClose={() => setShowEdit(false)} onSave={() => { setShowEdit(false); load(); }} toast={toast} />
      )}

      {showDelete && (
        <ConfirmDialog message={`¿Eliminar "${recipe.name}"?`} onConfirm={handleDelete} onCancel={() => setShowDelete(false)} />
      )}

      <ToastContainer toasts={toasts} />
    </div>
  );
}

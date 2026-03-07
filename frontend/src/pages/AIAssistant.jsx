import { useState } from 'react';
import { Sparkles, ChefHat, Clock, AlertCircle, Send } from 'lucide-react';
import { api } from '../utils/api';
import { useToast } from '../hooks/useToast';
import { ToastContainer, PageHeader } from '../components/layout/Layout.jsx';
import './AIAssistant.css';

export default function AIAssistant() {
  const [ingredients, setIngredients] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const { toasts, toast } = useToast();

  const examples = [
    'arroz, pollo, cebolla, ajo, pimiento rojo, aceite de oliva',
    'huevos, papa, espinaca, queso, manteca, ajo',
    'harina de arroz, azúcar, huevos, cacao en polvo, manteca',
    'lentejas, tomate, zanahoria, cebolla, comino, caldo',
  ];

  async function handleSubmit(e) {
    e?.preventDefault();
    if (!ingredients.trim()) {
      toast.error('Ingresá los ingredientes primero');
      return;
    }
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const data = await api.ai.suggest(ingredients);
      setResult(data.data);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const diffColor = { 'fácil': '#4E6B50', 'medio': '#8B6914', 'difícil': '#C0574A' };
  const diffBg = { 'fácil': 'rgba(78,107,80,0.1)', 'medio': 'rgba(139,105,20,0.1)', 'difícil': 'rgba(192,87,74,0.1)' };

  return (
    <div className="page-content">
      <div className="page-container">
        <PageHeader
          title="Asistente de cocina ✨"
          subtitle="Decime qué ingredientes tenés y te sugiero recetas sin gluten"
        />

        {/* API Key notice */}
        <div className="ai-notice">
          <AlertCircle size={16} />
          <div>
            <strong>Configuración de OpenAI:</strong> Para respuestas personalizadas, agregá tu API key de OpenAI en{' '}
            <code>backend/.env</code> → <code>OPENAI_API_KEY=sk-...</code>.
            Sin la key, las sugerencias son demostrativas.
          </div>
        </div>

        {/* Input form */}
        <div className="ai-input-section">
          <div className="ai-input-header">
            <div className="ai-input-icon"><ChefHat size={22} /></div>
            <div>
              <h3>¿Qué tenés en la cocina?</h3>
              <p>Listá tus ingredientes separados por coma</p>
            </div>
          </div>
          <form onSubmit={handleSubmit}>
            <textarea
              className="form-input form-textarea ai-textarea"
              value={ingredients}
              onChange={e => setIngredients(e.target.value)}
              placeholder="Ej: arroz, pollo, cebolla, ajo, tomate, aceite de oliva, huevos..."
              rows={4}
            />
            <div className="ai-examples">
              <span className="ai-examples-label">Ejemplos:</span>
              {examples.map((ex, i) => (
                <button key={i} type="button" className="ai-example-btn" onClick={() => setIngredients(ex)}>
                  {ex.split(',').slice(0, 3).join(', ')}...
                </button>
              ))}
            </div>
            <button type="submit" className="btn btn-primary btn-lg ai-submit-btn" disabled={loading || !ingredients.trim()}>
              {loading
                ? <><div className="spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Generando recetas...</>
                : <><Sparkles size={18} /> Sugerirme recetas</>
              }
            </button>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div className="ai-error">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="ai-results fade-in">
            <div className="ai-results-header">
              <Sparkles size={20} />
              <h2>Recetas sugeridas para vos</h2>
            </div>

            {result.general_tip && (
              <div className="ai-general-tip">
                💡 {result.general_tip}
              </div>
            )}

            <div className="ai-recipes">
              {result.recipes?.map((recipe, i) => (
                <div key={i} className="ai-recipe-card fade-in" style={{ animationDelay: `${i * 0.1}s` }}>
                  <div className="ai-recipe-header">
                    <div>
                      <h3>{recipe.name}</h3>
                      {recipe.description && <p className="ai-recipe-desc">{recipe.description}</p>}
                    </div>
                    <div className="ai-recipe-meta">
                      {recipe.difficulty && (
                        <span style={{ background: diffBg[recipe.difficulty], color: diffColor[recipe.difficulty], padding: '4px 10px', borderRadius: 100, fontSize: '0.78rem', fontWeight: 500 }}>
                          {recipe.difficulty}
                        </span>
                      )}
                      {recipe.prep_time && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.82rem', color: 'var(--mid-gray)' }}>
                          <Clock size={13} /> {recipe.prep_time}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="ai-recipe-body">
                    {recipe.ingredients_needed?.length > 0 && (
                      <div className="ai-recipe-section">
                        <div className="ai-recipe-section-title">🛒 Ingredientes necesarios</div>
                        <div className="ai-ingredient-list">
                          {recipe.ingredients_needed.map((ing, j) => (
                            <span key={j} className="ai-ingredient-tag ai-ingredient-have">{ing}</span>
                          ))}
                          {recipe.missing_ingredients?.filter(Boolean).map((ing, j) => (
                            <span key={j} className="ai-ingredient-tag ai-ingredient-missing" title="No tenés este ingrediente">{ing} ⚠️</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {recipe.steps?.length > 0 && (
                      <div className="ai-recipe-section">
                        <div className="ai-recipe-section-title">📋 Pasos</div>
                        <ol className="ai-steps">
                          {recipe.steps.map((step, j) => (
                            <li key={j} className="ai-step">
                              <div className="ai-step-num">{j + 1}</div>
                              <div className="ai-step-text">{step.replace(/^Paso \d+:\s*/i, '')}</div>
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {recipe.gluten_free_tip && (
                      <div className="ai-gluten-tip">
                        🌾 <strong>Tip sin gluten:</strong> {recipe.gluten_free_tip}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <ToastContainer toasts={toasts} />
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import { X, Upload, Plus, Trash2 } from 'lucide-react';
import { api, getPhotoUrl, DIFFICULTY_LEVELS, RECIPE_CATEGORIES } from '../../utils/api';

export default function RecipeForm({ recipeId, onClose, onSave, toast }) {
  const isEdit = !!recipeId;
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);
  const [ingredients, setIngredients] = useState(['']);
  const [steps, setSteps] = useState(['']);
  const [form, setForm] = useState({
    name: '', prep_time: '', cook_time: '', servings: '',
    difficulty: 'medio', category: '', notes: '',
  });
  const fileRef = useRef();

  useEffect(() => {
    if (isEdit) {
      api.recipes.get(recipeId).then(data => {
        const r = data.data;
        setForm({
          name: r.name || '', prep_time: r.prep_time ? String(r.prep_time) : '',
          cook_time: r.cook_time ? String(r.cook_time) : '',
          servings: r.servings ? String(r.servings) : '',
          difficulty: r.difficulty || 'medio', category: r.category || '', notes: r.notes || '',
        });
        // Parse ingredients
        try {
          const parsed = JSON.parse(r.ingredients);
          setIngredients(Array.isArray(parsed) ? parsed : r.ingredients.split('\n').filter(Boolean));
        } catch {
          setIngredients(r.ingredients.split('\n').filter(Boolean) || ['']);
        }
        // Parse steps
        try {
          const parsed = JSON.parse(r.instructions);
          setSteps(Array.isArray(parsed) ? parsed : r.instructions.split('\n').filter(Boolean));
        } catch {
          setSteps(r.instructions.split('\n').filter(Boolean) || ['']);
        }
        setExistingPhotos(r.photos || []);
      }).catch(() => toast.error('Error cargando receta')).finally(() => setFetchLoading(false));
    }
  }, [recipeId]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  function handleFiles(e) {
    const files = Array.from(e.target.files);
    setNewFiles(f => [...f, ...files]);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => setNewPreviews(p => [...p, { url: ev.target.result }]);
      reader.readAsDataURL(file);
    });
  }

  async function deleteExistingPhoto(photoId) {
    try {
      await api.recipes.deletePhoto(recipeId, photoId);
      setExistingPhotos(p => p.filter(ph => ph.id !== photoId));
      toast.success('Foto eliminada');
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const validIngredients = ingredients.filter(i => i.trim());
    const validSteps = steps.filter(s => s.trim());
    if (!form.name || validIngredients.length === 0 || validSteps.length === 0) {
      toast.error('Nombre, ingredientes e instrucciones son obligatorios');
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('name', form.name);
      fd.append('ingredients', JSON.stringify(validIngredients));
      fd.append('instructions', JSON.stringify(validSteps));
      if (form.prep_time) fd.append('prep_time', form.prep_time);
      if (form.cook_time) fd.append('cook_time', form.cook_time);
      if (form.servings) fd.append('servings', form.servings);
      fd.append('difficulty', form.difficulty);
      if (form.category) fd.append('category', form.category);
      if (form.notes) fd.append('notes', form.notes);
      newFiles.forEach(f => fd.append('photos', f));

      if (isEdit) await api.recipes.update(recipeId, fd);
      else await api.recipes.create(fd);

      toast.success(isEdit ? 'Receta actualizada ✓' : 'Receta guardada ✓');
      onSave();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  const updateItem = (list, setList, idx, val) => {
    const copy = [...list];
    copy[idx] = val;
    setList(copy);
  };
  const addItem = (list, setList) => setList([...list, '']);
  const removeItem = (list, setList, idx) => setList(list.filter((_, i) => i !== idx));

  if (fetchLoading) return (
    <div className="modal-overlay"><div className="modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}><div className="spinner" /></div></div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth: 720 }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? 'Editar receta' : 'Nueva receta'}</h3>
          <button className="btn btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ display: 'grid', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Nombre de la receta *</label>
                <input className="form-input" name="name" value={form.name} onChange={handleChange} placeholder="Ej: Torta de chocolate sin gluten" required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                <div className="form-group">
                  <label className="form-label">Prep (min)</label>
                  <input className="form-input" name="prep_time" type="number" value={form.prep_time} onChange={handleChange} placeholder="20" min="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Cocción (min)</label>
                  <input className="form-input" name="cook_time" type="number" value={form.cook_time} onChange={handleChange} placeholder="30" min="0" />
                </div>
                <div className="form-group">
                  <label className="form-label">Porciones</label>
                  <input className="form-input" name="servings" type="number" value={form.servings} onChange={handleChange} placeholder="4" min="1" />
                </div>
                <div className="form-group">
                  <label className="form-label">Dificultad</label>
                  <select className="form-input" name="difficulty" value={form.difficulty} onChange={handleChange}>
                    {DIFFICULTY_LEVELS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Categoría</label>
                <select className="form-input" name="category" value={form.category} onChange={handleChange}>
                  <option value="">Sin categoría</option>
                  {RECIPE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Ingredients */}
              <div className="form-group">
                <label className="form-label">Ingredientes *</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {ingredients.map((ing, i) => (
                    <div key={i} style={{ display: 'flex', gap: 6 }}>
                      <input
                        className="form-input"
                        value={ing}
                        onChange={e => updateItem(ingredients, setIngredients, i, e.target.value)}
                        placeholder={`Ingrediente ${i + 1}...`}
                      />
                      {ingredients.length > 1 && (
                        <button type="button" className="btn btn-ghost" onClick={() => removeItem(ingredients, setIngredients, i)}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => addItem(ingredients, setIngredients)}>
                    <Plus size={13} /> Agregar ingrediente
                  </button>
                </div>
              </div>

              {/* Instructions */}
              <div className="form-group">
                <label className="form-label">Instrucciones paso a paso *</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {steps.map((step, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <div style={{
                        minWidth: 26, height: 26, borderRadius: '50%', background: 'var(--sage)',
                        color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '0.75rem', fontWeight: 700, marginTop: 10, flexShrink: 0
                      }}>{i + 1}</div>
                      <textarea
                        className="form-input form-textarea"
                        style={{ minHeight: 60 }}
                        value={step}
                        onChange={e => updateItem(steps, setSteps, i, e.target.value)}
                        placeholder={`Paso ${i + 1}...`}
                      />
                      {steps.length > 1 && (
                        <button type="button" className="btn btn-ghost" style={{ marginTop: 8 }} onClick={() => removeItem(steps, setSteps, i)}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                  <button type="button" className="btn btn-secondary btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => addItem(steps, setSteps)}>
                    <Plus size={13} /> Agregar paso
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notas</label>
                <textarea className="form-input form-textarea" name="notes" value={form.notes} onChange={handleChange} placeholder="Tips, variaciones, consejos..." />
              </div>

              {/* Photos */}
              <div className="form-group">
                <label className="form-label">Fotos</label>
                {existingPhotos.length > 0 && (
                  <div className="photo-grid" style={{ marginBottom: 8 }}>
                    {existingPhotos.map(ph => (
                      <div key={ph.id} className="photo-thumb">
                        <img src={getPhotoUrl('recipes', ph.filename)} alt="" />
                        <button className="photo-thumb-delete" type="button" onClick={() => deleteExistingPhoto(ph.id)}>×</button>
                      </div>
                    ))}
                  </div>
                )}
                {newPreviews.length > 0 && (
                  <div className="photo-grid" style={{ marginBottom: 8 }}>
                    {newPreviews.map((p, i) => (
                      <div key={i} className="photo-thumb">
                        <img src={p.url} alt="" />
                        <button className="photo-thumb-delete" type="button" onClick={() => { setNewFiles(f => f.filter((_, j) => j !== i)); setNewPreviews(p => p.filter((_, j) => j !== i)); }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
                <input ref={fileRef} type="file" multiple accept="image/*" style={{ display: 'none' }} onChange={handleFiles} />
                <button type="button" className="btn btn-secondary btn-sm" onClick={() => fileRef.current.click()}>
                  <Upload size={14} /> Agregar fotos
                </button>
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Guardar receta'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

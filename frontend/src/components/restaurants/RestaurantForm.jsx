import { useState, useEffect, useRef } from 'react';
import { X, Upload, Trash2, MapPin } from 'lucide-react';
import { api, getPhotoUrl, GLUTEN_LEVELS, PRICE_RANGES, FOOD_TYPES } from '../../utils/api';

export default function RestaurantForm({ restaurantId, onClose, onSave, toast }) {
  const isEdit = !!restaurantId;
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(isEdit);
  const [existingPhotos, setExistingPhotos] = useState([]);
  const [newFiles, setNewFiles] = useState([]);
  const [newPreviews, setNewPreviews] = useState([]);
  const [form, setForm] = useState({
    name: '', city: '', country: '', address: '', food_type: '',
    gluten_level: 'opciones_sin_gluten', menu: '', price_range: '',
    notes: '', rating: '0', latitude: '', longitude: '', website: '', phone: '',
  });
  const fileRef = useRef();

  useEffect(() => {
    if (isEdit) {
      api.restaurants.get(restaurantId).then(data => {
        const r = data.data;
        setForm({
          name: r.name || '', city: r.city || '', country: r.country || '',
          address: r.address || '', food_type: r.food_type || '',
          gluten_level: r.gluten_level || 'opciones_sin_gluten',
          menu: r.menu || '', price_range: r.price_range || '',
          notes: r.notes || '', rating: String(r.rating || 0),
          latitude: r.latitude ? String(r.latitude) : '',
          longitude: r.longitude ? String(r.longitude) : '',
          website: r.website || '', phone: r.phone || '',
        });
        setExistingPhotos(r.photos || []);
      }).catch(() => toast.error('Error cargando restaurante')).finally(() => setFetchLoading(false));
    }
  }, [restaurantId]);

  function handleChange(e) {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
  }

  function handleFiles(e) {
    const files = Array.from(e.target.files);
    setNewFiles(f => [...f, ...files]);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = ev => setNewPreviews(p => [...p, { url: ev.target.result, name: file.name }]);
      reader.readAsDataURL(file);
    });
  }

  function removeNewFile(idx) {
    setNewFiles(f => f.filter((_, i) => i !== idx));
    setNewPreviews(p => p.filter((_, i) => i !== idx));
  }

  async function deleteExistingPhoto(photoId) {
    try {
      await api.restaurants.deletePhoto(restaurantId, photoId);
      setExistingPhotos(p => p.filter(ph => ph.id !== photoId));
      toast.success('Foto eliminada');
    } catch (e) {
      toast.error(e.message);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.city || !form.country) {
      toast.error('Nombre, ciudad y país son obligatorios');
      return;
    }
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v !== '') fd.append(k, v); });
      newFiles.forEach(f => fd.append('photos', f));

      if (isEdit) await api.restaurants.update(restaurantId, fd);
      else await api.restaurants.create(fd);

      toast.success(isEdit ? 'Restaurante actualizado ✓' : 'Restaurante agregado ✓');
      onSave();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  }

  if (fetchLoading) return (
    <div className="modal-overlay">
      <div className="modal" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 200 }}>
        <div className="spinner" />
      </div>
    </div>
  );

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{isEdit ? 'Editar restaurante' : 'Nuevo restaurante'}</h3>
          <button className="btn btn-ghost" onClick={onClose}><X size={18} /></button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ display: 'grid', gap: 16 }}>
              <div className="form-group">
                <label className="form-label">Nombre del restaurante *</label>
                <input className="form-input" name="name" value={form.name} onChange={handleChange} placeholder="Ej: La Parrilla Sin TACC" required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Ciudad *</label>
                  <input className="form-input" name="city" value={form.city} onChange={handleChange} placeholder="Buenos Aires" required />
                </div>
                <div className="form-group">
                  <label className="form-label">País *</label>
                  <input className="form-input" name="country" value={form.country} onChange={handleChange} placeholder="Argentina" required />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Dirección</label>
                <input className="form-input" name="address" value={form.address} onChange={handleChange} placeholder="Calle 123, Palermo" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Tipo de comida</label>
                  <input list="food-types" className="form-input" name="food_type" value={form.food_type} onChange={handleChange} placeholder="Italiana, Parrilla..." />
                  <datalist id="food-types">{FOOD_TYPES.map(f => <option key={f} value={f} />)}</datalist>
                </div>
                <div className="form-group">
                  <label className="form-label">Precio aproximado</label>
                  <select className="form-input" name="price_range" value={form.price_range} onChange={handleChange}>
                    <option value="">Sin especificar</option>
                    {PRICE_RANGES.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Nivel de seguridad sin gluten *</label>
                <select className="form-input" name="gluten_level" value={form.gluten_level} onChange={handleChange}>
                  {GLUTEN_LEVELS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Calificación ({form.rating}/5)</label>
                <div className="star-rating">
                  {[1,2,3,4,5].map(n => (
                    <button key={n} type="button" onClick={() => setForm(f => ({ ...f, rating: String(n) }))}>
                      {n <= parseInt(form.rating) ? '★' : '☆'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Menú / Platos recomendados</label>
                <textarea className="form-input form-textarea" name="menu" value={form.menu} onChange={handleChange} placeholder="Describí el menú o tus platos favoritos..." />
              </div>

              <div className="form-group">
                <label className="form-label">Notas personales</label>
                <textarea className="form-input form-textarea" name="notes" value={form.notes} onChange={handleChange} placeholder="Observaciones, tips, cómo llegar..." />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Teléfono</label>
                  <input className="form-input" name="phone" value={form.phone} onChange={handleChange} placeholder="+54 11 1234-5678" />
                </div>
                <div className="form-group">
                  <label className="form-label">Sitio web</label>
                  <input className="form-input" name="website" value={form.website} onChange={handleChange} placeholder="https://..." />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="form-group">
                  <label className="form-label" title="Para mostrar en el mapa"><MapPin size={12} style={{ display: 'inline' }} /> Latitud</label>
                  <input className="form-input" name="latitude" value={form.latitude} onChange={handleChange} placeholder="-34.6037" type="number" step="any" />
                </div>
                <div className="form-group">
                  <label className="form-label"><MapPin size={12} style={{ display: 'inline' }} /> Longitud</label>
                  <input className="form-input" name="longitude" value={form.longitude} onChange={handleChange} placeholder="-58.3816" type="number" step="any" />
                </div>
              </div>

              {/* Photos */}
              <div className="form-group">
                <label className="form-label">Fotos</label>
                {existingPhotos.length > 0 && (
                  <div className="photo-grid" style={{ marginBottom: 8 }}>
                    {existingPhotos.map(ph => (
                      <div key={ph.id} className="photo-thumb">
                        <img src={getPhotoUrl('restaurants', ph.filename)} alt="" />
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
                        <button className="photo-thumb-delete" type="button" onClick={() => removeNewFile(i)}>×</button>
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
              {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Agregar restaurante'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

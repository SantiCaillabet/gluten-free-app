const BASE = '/api';

async function request(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, options);
  const data = await res.json();
  if (!res.ok || !data.success) throw new Error(data.error || 'Error en la solicitud');
  return data;
}

// Restaurants
export const api = {
  restaurants: {
    list: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/restaurants${q ? '?' + q : ''}`);
    },
    get: (id) => request(`/restaurants/${id}`),
    create: (formData) => request('/restaurants', { method: 'POST', body: formData }),
    update: (id, formData) => request(`/restaurants/${id}`, { method: 'PUT', body: formData }),
    delete: (id) => request(`/restaurants/${id}`, { method: 'DELETE' }),
    deletePhoto: (restaurantId, photoId) =>
      request(`/restaurants/${restaurantId}/photos/${photoId}`, { method: 'DELETE' }),
  },
  recipes: {
    list: (params = {}) => {
      const q = new URLSearchParams(params).toString();
      return request(`/recipes${q ? '?' + q : ''}`);
    },
    get: (id) => request(`/recipes/${id}`),
    create: (formData) => request('/recipes', { method: 'POST', body: formData }),
    update: (id, formData) => request(`/recipes/${id}`, { method: 'PUT', body: formData }),
    delete: (id) => request(`/recipes/${id}`, { method: 'DELETE' }),
    deletePhoto: (recipeId, photoId) =>
      request(`/recipes/${recipeId}/photos/${photoId}`, { method: 'DELETE' }),
  },
  ai: {
    suggest: (ingredients) => request('/ai/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ingredients })
    }),
    history: () => request('/ai/history'),
  }
};

export const getPhotoUrl = (folder, filename) =>
  filename ? `/uploads/${folder}/${filename}` : null;

export const GLUTEN_LEVELS = [
  { value: '100_sin_gluten', label: '100% Sin Gluten', color: 'green' },
  { value: 'certificado', label: 'Certificado SIN TACC', color: 'green' },
  { value: 'opciones_sin_gluten', label: 'Opciones sin gluten', color: 'yellow' },
  { value: 'puede_adaptar', label: 'Puede adaptar', color: 'yellow' },
  { value: 'contaminacion_cruzada', label: 'Riesgo contaminación', color: 'red' },
];

export const DIFFICULTY_LEVELS = [
  { value: 'fácil', label: 'Fácil', color: 'green' },
  { value: 'medio', label: 'Medio', color: 'yellow' },
  { value: 'difícil', label: 'Difícil', color: 'red' },
];

export const PRICE_RANGES = ['$', '$$', '$$$', '$$$$'];

export const FOOD_TYPES = [
  'Italiana', 'Mexicana', 'Japonesa', 'Argentina', 'Americana',
  'Mediterránea', 'Peruana', 'China', 'India', 'Francesa', 'Española',
  'Árabe', 'Griega', 'Tailandesa', 'Vegana', 'Parrilla', 'Mariscos',
  'Pizza', 'Sushi', 'Hamburguesas', 'Ensaladas', 'Café', 'Pastelería',
];

export const RECIPE_CATEGORIES = [
  'Desayuno', 'Almuerzo', 'Cena', 'Merienda', 'Postre',
  'Entrada', 'Pasta', 'Sopas', 'Ensaladas', 'Pan', 'Tortas',
  'Galletas', 'Bebidas', 'Snacks',
];

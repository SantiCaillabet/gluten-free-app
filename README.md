# 🌾 GlutenFree App

> Tu guía personal sin TACC — Gestión de restaurantes, recetas y asistente de cocina con IA

---

## 📐 Arquitectura del Proyecto

```
gluten-free-app/
├── backend/                    # API REST con Node.js + Express
│   ├── models/
│   │   └── database.js        # SQLite schema + inicialización
│   ├── middleware/
│   │   └── upload.js          # Multer para manejo de imágenes
│   ├── routes/
│   │   ├── restaurants.js     # CRUD restaurantes
│   │   ├── recipes.js         # CRUD recetas
│   │   └── ai.js              # Asistente IA (OpenAI)
│   ├── uploads/               # Imágenes subidas (git-ignored)
│   │   ├── restaurants/
│   │   └── recipes/
│   ├── database.sqlite        # Base de datos (git-ignored)
│   ├── server.js              # Entry point
│   ├── .env                   # Variables de entorno (git-ignored)
│   └── package.json
│
├── frontend/                  # SPA con React + Vite
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/        # Sidebar, MobileNav, Toast, etc.
│   │   │   ├── restaurants/   # RestaurantForm, RestaurantMap
│   │   │   └── recipes/       # RecipeForm
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx  # Pantalla principal
│   │   │   ├── Restaurants.jsx
│   │   │   ├── RestaurantDetail.jsx
│   │   │   ├── Recipes.jsx
│   │   │   ├── RecipeDetail.jsx
│   │   │   └── AIAssistant.jsx
│   │   ├── hooks/
│   │   │   └── useToast.js    # Hook para notificaciones
│   │   ├── utils/
│   │   │   └── api.js         # Cliente HTTP + constantes
│   │   ├── App.jsx            # Router principal
│   │   ├── main.jsx
│   │   └── index.css          # Design system completo
│   └── package.json
│
├── setup.sh                   # Script de instalación
└── README.md
```

---

## 🛠 Stack Tecnológico Elegido

### Backend: Node.js + Express
**¿Por qué?** — Express es el framework más maduro del ecosistema JS, con cero overhead. Para una app personal, su simplicidad supera a alternativas como NestJS (demasiado opinionado) o Fastify (menos ecosistema).

### Base de datos: SQLite (via better-sqlite3)
**¿Por qué?** — Para una app personal local, SQLite es ideal: cero configuración, un solo archivo, velocísimo, y escalable a PostgreSQL con mínimos cambios cuando sea necesario. `better-sqlite3` es la mejor binding disponible: síncrona, rápida, y sin callbacks.

### Frontend: React + Vite
**¿Por qué React?** — Ecosistema robusto, componentes reutilizables, y fácil migración a React Native si querés una app móvil después. **¿Por qué Vite?** — 10-100x más rápido que CRA, con HMR instantáneo.

### Routing: React Router v6
**¿Por qué?** — Estándar de facto para SPAs en React. La API de v6 con hooks es la más limpia disponible.

### Mapas: Leaflet + OpenStreetMap
**¿Por qué?** — Gratis, sin API key, excelente para uso personal. Google Maps requiere tarjeta de crédito.

### Estilos: CSS puro con design system de variables CSS
**¿Por qué no Tailwind?** — Para una app personal con diseño único, CSS custom da más control y evita dependencias de build. Las CSS variables garantizan consistencia total.

---

## 🗃 Diseño de Base de Datos

### Tabla `restaurants`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER PK | Identificador único auto-incremental |
| name | TEXT NOT NULL | Nombre del restaurante |
| city | TEXT NOT NULL | Ciudad |
| country | TEXT NOT NULL | País |
| address | TEXT | Dirección completa |
| food_type | TEXT | Tipo de cocina |
| gluten_level | TEXT | Nivel de seguridad sin gluten |
| menu | TEXT | Descripción del menú |
| price_range | TEXT | Rango de precios ($, $$, etc.) |
| notes | TEXT | Notas personales |
| rating | REAL | Calificación (0-5) |
| latitude | REAL | Coordenada para el mapa |
| longitude | REAL | Coordenada para el mapa |
| website | TEXT | URL del sitio web |
| phone | TEXT | Teléfono |
| created_at | TEXT | Fecha de creación |
| updated_at | TEXT | Fecha de última modificación |

### Tabla `restaurant_photos`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER PK | |
| restaurant_id | INTEGER FK | Referencia a `restaurants.id` (CASCADE DELETE) |
| filename | TEXT | Nombre del archivo en disco |
| original_name | TEXT | Nombre original del archivo |
| created_at | TEXT | |

### Tabla `recipes`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER PK | |
| name | TEXT NOT NULL | Nombre de la receta |
| ingredients | TEXT NOT NULL | JSON array de ingredientes |
| instructions | TEXT NOT NULL | JSON array de pasos |
| prep_time | INTEGER | Tiempo de preparación en minutos |
| cook_time | INTEGER | Tiempo de cocción en minutos |
| servings | INTEGER | Número de porciones |
| difficulty | TEXT | fácil / medio / difícil |
| category | TEXT | Desayuno, Almuerzo, Postre, etc. |
| notes | TEXT | Notas y tips |
| created_at | TEXT | |
| updated_at | TEXT | |

### Tabla `recipe_photos`
Igual a `restaurant_photos` pero referenciando `recipes`.

### Tabla `ai_conversations`
| Campo | Tipo | Descripción |
|-------|------|-------------|
| id | INTEGER PK | |
| ingredients | TEXT | Ingredientes ingresados |
| response | TEXT | Respuesta JSON de la IA |
| created_at | TEXT | |

---

## 🚀 Instrucciones para correr localmente

### Requisitos
- **Node.js 18+** → [descargar aquí](https://nodejs.org)

### Instalación rápida (con script)
```bash
# 1. Entrá a la carpeta del proyecto
cd gluten-free-app

# 2. Dale permisos al script y ejecutalo
chmod +x setup.sh && ./setup.sh
```

### Instalación manual
```bash
# Backend
cd backend
npm install
cp .env.example .env    # Luego editá el .env

# Frontend
cd ../frontend
npm install
```

### Correr la app

**Opción A — Dos terminales separadas (recomendado):**
```bash
# Terminal 1: Backend
cd backend
npm run dev
# → Corre en http://localhost:3001

# Terminal 2: Frontend
cd frontend
npm run dev
# → Corre en http://localhost:5173
```

**Opción B — Con concurrently (desde la raíz):**
```bash
npm install   # instala concurrently
npm run dev   # corre ambos a la vez
```

### Abrir la app
Abrí tu navegador en: **http://localhost:5173**

---

## 🤖 Configurar el Asistente IA con OpenAI

### 1. Obtener una API Key
1. Creá una cuenta en [platform.openai.com](https://platform.openai.com)
2. Andá a **API Keys** → **Create new secret key**
3. Copiá la key (empieza con `sk-...`)

### 2. Configurar en la app
Editá el archivo `backend/.env`:
```env
PORT=3001
OPENAI_API_KEY=sk-tu-api-key-aqui
```

### 3. Reiniciar el backend
```bash
# Ctrl+C para detener, luego:
npm run dev
```

### Costo estimado
El asistente usa `gpt-4o-mini` que cuesta ~$0.00015 por petición. Con uso personal, el costo es prácticamente cero.

### Sin API Key
Sin configurar la key, el asistente igual funciona con respuestas de demostración para que puedas probar la interfaz.

---

## 🌐 Despliegue en Producción

### Opción 1: VPS simple (Railway, Render, DigitalOcean)

**Backend en Railway:**
```bash
# 1. Subí el código a GitHub
# 2. Creá un proyecto en railway.app
# 3. Conectá tu repo
# 4. Configurá variables de entorno en Railway:
#    OPENAI_API_KEY=sk-...
#    NODE_ENV=production
# 5. Railway detecta Node.js automáticamente
```

**Frontend en Vercel:**
```bash
# 1. Instalá Vercel CLI
npm i -g vercel

# 2. Editá vite.config.js para apuntar al backend en producción
# 3. Deploy
cd frontend && vercel
```

### Opción 2: Docker (más portable)

```dockerfile
# Dockerfile para backend
FROM node:20-alpine
WORKDIR /app
COPY backend/package*.json ./
RUN npm install --production
COPY backend/ .
EXPOSE 3001
CMD ["node", "server.js"]
```

```bash
docker build -t glutenfree-backend .
docker run -p 3001:3001 -e OPENAI_API_KEY=sk-... glutenfree-backend
```

### Opción 3: Migrar a PostgreSQL (para mayor escala)

Para escalar la base de datos, reemplazá `better-sqlite3` por `pg` (node-postgres):
```bash
cd backend
npm uninstall better-sqlite3
npm install pg
```
Los cambios en las queries son mínimos dado el uso de SQL estándar.

---

## 💡 Mejoras Futuras Sugeridas

### Funcionalidades
- **Etiquetas/Tags** en restaurantes y recetas para mejor organización
- **Historial de visitas** a restaurantes con fechas
- **Lista de compras** generada desde recetas
- **Planificador de menú** semanal
- **Export/Import** en CSV o PDF
- **Compartir** recetas vía link público
- **OCR de menús** — subí una foto y la IA extrae los platos sin gluten
- **Notificaciones** cuando hay restaurantes nuevos cerca

### Técnico
- **Autenticación** con JWT para multiusuario
- **PWA** (Progressive Web App) para instalarla en el celular
- **Sync offline** con Service Workers
- **Caché** de imágenes en el cliente
- **Compresión de imágenes** automática al subir con Sharp
- **Tests** con Vitest + Supertest
- **CI/CD** con GitHub Actions

---

## 📡 API Reference

### Restaurantes
```
GET    /api/restaurants              Lista con filtros (?search=&gluten_level=&sort=)
GET    /api/restaurants/:id          Detalle de un restaurante
POST   /api/restaurants              Crear (multipart/form-data)
PUT    /api/restaurants/:id          Actualizar (multipart/form-data)
DELETE /api/restaurants/:id          Eliminar
DELETE /api/restaurants/:id/photos/:photoId   Eliminar una foto
```

### Recetas
```
GET    /api/recipes                  Lista con filtros
GET    /api/recipes/:id              Detalle
POST   /api/recipes                  Crear
PUT    /api/recipes/:id              Actualizar
DELETE /api/recipes/:id              Eliminar
DELETE /api/recipes/:id/photos/:photoId
```

### IA
```
POST   /api/ai/suggest    Body: { ingredients: "arroz, pollo, cebolla" }
GET    /api/ai/history    Historial de consultas
```

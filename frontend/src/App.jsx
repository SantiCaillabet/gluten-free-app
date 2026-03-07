import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Sidebar, MobileNav } from './components/layout/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Restaurants from './pages/Restaurants.jsx';
import RestaurantDetail from './pages/RestaurantDetail.jsx';
import Recipes from './pages/Recipes.jsx';
import RecipeDetail from './pages/RecipeDetail.jsx';
import AIAssistant from './pages/AIAssistant.jsx';
import './components/layout/Layout.css';

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-layout">
        <Sidebar />
        <main className="app-main">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/restaurantes" element={<Restaurants />} />
            <Route path="/restaurantes/:id" element={<RestaurantDetail />} />
            <Route path="/recetas" element={<Recipes />} />
            <Route path="/recetas/:id" element={<RecipeDetail />} />
            <Route path="/asistente" element={<AIAssistant />} />
          </Routes>
        </main>
        <MobileNav />
      </div>
    </BrowserRouter>
  );
}

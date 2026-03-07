import { useEffect, useRef } from 'react';
import { GLUTEN_LEVELS, getPhotoUrl } from '../../utils/api';

export default function RestaurantMap({ restaurants, onSelect }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Dynamically load Leaflet
    const L = window.L;
    if (!L) {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => initMap();
      document.head.appendChild(script);
    } else {
      initMap();
    }

    function initMap() {
      const L = window.L;
      if (!mapRef.current || mapInstanceRef.current) return;

      const withCoords = restaurants.filter(r => r.latitude && r.longitude);
      const center = withCoords.length > 0
        ? [withCoords[0].latitude, withCoords[0].longitude]
        : [-34.6037, -58.3816]; // Buenos Aires default

      const map = L.map(mapRef.current).setView(center, 12);
      mapInstanceRef.current = map;

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      }).addTo(map);

      const colorMap = { green: '#4E6B50', yellow: '#C9A84C', red: '#C0574A', gray: '#8A8A8A' };

      withCoords.forEach(r => {
        const gluten = GLUTEN_LEVELS.find(g => g.value === r.gluten_level) || { color: 'gray' };
        const color = colorMap[gluten.color] || '#8A8A8A';

        const icon = L.divIcon({
          className: '',
          html: `<div style="
            width:38px; height:38px; border-radius:50% 50% 50% 0; transform:rotate(-45deg);
            background:${color}; border:3px solid white; box-shadow:0 2px 8px rgba(0,0,0,0.3);
            display:flex; align-items:center; justify-content:center;
          "><span style="transform:rotate(45deg); font-size:16px;">🍽️</span></div>`,
          iconSize: [38, 38],
          iconAnchor: [19, 38],
          popupAnchor: [0, -40],
        });

        const marker = L.marker([r.latitude, r.longitude], { icon }).addTo(map);
        marker.bindPopup(`
          <div style="font-family: 'DM Sans', sans-serif; min-width: 180px;">
            ${r.cover_photo ? `<img src="/uploads/restaurants/${r.cover_photo}" style="width:100%; height:100px; object-fit:cover; border-radius:8px; margin-bottom:8px;" />` : ''}
            <strong style="font-size:1rem;">${r.name}</strong><br/>
            <span style="color:#8A8A8A; font-size:0.8rem;">${r.city}, ${r.country}</span><br/>
            ${r.food_type ? `<span style="font-size:0.8rem;">${r.food_type}</span><br/>` : ''}
            <button onclick="window._mapSelectRestaurant(${r.id})" style="
              margin-top:8px; padding:6px 14px; background:#7C9A7E; color:white;
              border:none; border-radius:8px; cursor:pointer; font-size:0.82rem; width:100%;
            ">Ver ficha completa</button>
          </div>
        `);
      });

      window._mapSelectRestaurant = (id) => onSelect(id);

      // Fit bounds
      if (withCoords.length > 1) {
        const bounds = L.latLngBounds(withCoords.map(r => [r.latitude, r.longitude]));
        map.fitBounds(bounds, { padding: [40, 40] });
      }
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [restaurants]);

  const withCoords = restaurants.filter(r => r.latitude && r.longitude);

  return (
    <div>
      {withCoords.length === 0 && (
        <div style={{
          background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)',
          borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 16,
          fontSize: '0.85rem', color: '#8B6914', display: 'flex', alignItems: 'center', gap: 8
        }}>
          📍 Ningún restaurante tiene coordenadas. Editá los restaurantes y agregá latitud/longitud para verlos en el mapa.
        </div>
      )}
      <div
        ref={mapRef}
        style={{ height: 520, borderRadius: 'var(--radius-xl)', overflow: 'hidden', border: '1px solid var(--border)' }}
      />
    </div>
  );
}

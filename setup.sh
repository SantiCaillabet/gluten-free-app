#!/bin/bash

echo ""
echo "🌾 ======================================"
echo "   GlutenFree App - Setup"
echo "========================================"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
  echo "❌ Node.js no está instalado."
  echo "   Instalalo desde: https://nodejs.org (versión 18+)"
  exit 1
fi

NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VER" -lt 18 ]; then
  echo "❌ Necesitás Node.js 18 o superior. Tenés v$(node -v)"
  exit 1
fi

echo "✓ Node.js $(node -v) detectado"

# Install backend
echo ""
echo "📦 Instalando dependencias del backend..."
cd backend && npm install
if [ $? -ne 0 ]; then
  echo "❌ Error instalando dependencias del backend"
  exit 1
fi
echo "✓ Backend listo"

# Create .env if not exists
if [ ! -f .env ]; then
  cp .env.example .env
  echo "✓ Archivo .env creado (editalo para agregar tu API key de OpenAI)"
fi

cd ..

# Install frontend
echo ""
echo "📦 Instalando dependencias del frontend..."
cd frontend && npm install
if [ $? -ne 0 ]; then
  echo "❌ Error instalando dependencias del frontend"
  exit 1
fi
echo "✓ Frontend listo"

cd ..

echo ""
echo "✅ ======================================"
echo "   ¡Setup completado!"
echo "========================================"
echo ""
echo "Para correr la app, abrí DOS terminales:"
echo ""
echo "  Terminal 1 (Backend):"
echo "  cd backend && npm run dev"
echo ""
echo "  Terminal 2 (Frontend):"
echo "  cd frontend && npm run dev"
echo ""
echo "Luego abrí: http://localhost:5173"
echo ""
echo "💡 Para usar el asistente IA:"
echo "   Editá backend/.env y agregá:"
echo "   OPENAI_API_KEY=sk-tu-api-key-aqui"
echo ""

const express = require('express');
const router = express.Router();
const { getDb } = require('../models/database');

// POST generate recipe suggestions from ingredients
router.post('/suggest', async (req, res) => {
  try {
    const { ingredients } = req.body;

    if (!ingredients || ingredients.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Por favor ingresá los ingredientes que tenés' });
    }

    const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

    let response;

    if (!OPENAI_API_KEY || OPENAI_API_KEY === 'sk-your-openai-api-key-here') {
      // Mock response when no API key is configured
      response = generateMockResponse(ingredients);
    } else {
      // Real OpenAI call
      response = await callOpenAI(ingredients, OPENAI_API_KEY);
    }

    // Save conversation to DB
    const db = getDb();
    db.prepare('INSERT INTO ai_conversations (ingredients, response) VALUES (?, ?)').run(
      ingredients, JSON.stringify(response)
    );

    res.json({ success: true, data: response });
  } catch (err) {
    console.error('AI Error:', err);
    res.status(500).json({ success: false, error: 'Error al generar sugerencias. Verificá tu API key de OpenAI.' });
  }
});

async function callOpenAI(ingredients, apiKey) {
  const prompt = `Soy celíaco y tengo estos ingredientes disponibles: ${ingredients}

Por favor sugierme 3 recetas sin gluten que pueda hacer con estos ingredientes (o la mayoría de ellos).

Para cada receta respondé en el siguiente formato JSON exacto:
{
  "recipes": [
    {
      "name": "Nombre de la receta",
      "description": "Descripción breve y apetitosa",
      "difficulty": "fácil|medio|difícil",
      "prep_time": "20 minutos",
      "ingredients_needed": ["ingrediente 1", "ingrediente 2"],
      "missing_ingredients": ["ingrediente que falta si hubiera alguno"],
      "steps": ["Paso 1: ...", "Paso 2: ...", "Paso 3: ..."],
      "gluten_free_tip": "Tip específico para asegurar que quede libre de gluten"
    }
  ],
  "general_tip": "Un consejo general sobre cocina sin gluten con estos ingredientes"
}

Respondé SOLO con el JSON, sin texto adicional.`;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'Sos un chef experto en cocina sin gluten. Siempre respondés en español y en formato JSON válido.'
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    })
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Error en OpenAI API');
  }

  const data = await response.json();
  const content = data.choices[0].message.content.trim();
  
  // Clean JSON fences if present
  const clean = content.replace(/```json\n?|\n?```/g, '').trim();
  return JSON.parse(clean);
}

function generateMockResponse(ingredients) {
  return {
    recipes: [
      {
        name: "Tortilla de verduras sin gluten",
        description: "Una tortilla esponjosa y colorida, perfecta para cualquier momento del día",
        difficulty: "fácil",
        prep_time: "20 minutos",
        ingredients_needed: ingredients.split(',').slice(0, 3).map(i => i.trim()),
        missing_ingredients: [],
        steps: [
          "Paso 1: Lavá y cortá todas las verduras en trozos medianos",
          "Paso 2: Batí los huevos con sal y pimienta en un bowl",
          "Paso 3: Saltea las verduras en aceite de oliva por 5 minutos",
          "Paso 4: Vertí los huevos sobre las verduras y cocinalo a fuego medio-bajo",
          "Paso 5: Cubrí la sartén y cocinalo 8 minutos hasta que cuaje"
        ],
        gluten_free_tip: "Verificá que todos los condimentos usados estén certificados sin TACC"
      },
      {
        name: "Bowl de arroz con proteínas",
        description: "Un bowl nutritivo y saciante con arroz integral y proteínas de calidad",
        difficulty: "fácil",
        prep_time: "30 minutos",
        ingredients_needed: ingredients.split(',').slice(0, 4).map(i => i.trim()),
        missing_ingredients: ["salsa tamari (opcional)"],
        steps: [
          "Paso 1: Cocinás el arroz integral según las instrucciones del paquete",
          "Paso 2: Condimentás la proteína con aceite, ajo y especias sin gluten",
          "Paso 3: Cocinás la proteína en sartén bien caliente",
          "Paso 4: Armás el bowl con el arroz de base",
          "Paso 5: Agregás la proteína y terminás con palta o verduras frescas"
        ],
        gluten_free_tip: "Usá salsa tamari en lugar de salsa de soja común, que puede contener gluten"
      },
      {
        name: "Ensalada completa con proteínas",
        description: "Una ensalada fresca y completa que funciona como plato principal",
        difficulty: "fácil",
        prep_time: "15 minutos",
        ingredients_needed: ingredients.split(',').slice(0, 3).map(i => i.trim()),
        missing_ingredients: [],
        steps: [
          "Paso 1: Lavás y cortás todas las verduras frescas",
          "Paso 2: Preparás el aderezo con aceite de oliva, limón, sal y pimienta",
          "Paso 3: Mezclás todos los ingredientes en un bowl grande",
          "Paso 4: Agregás la proteína por encima",
          "Paso 5: Rociás con el aderezo justo antes de servir"
        ],
        gluten_free_tip: "Revisá que el aderezo comprado no contenga espesantes con gluten"
      }
    ],
    general_tip: "⚠️ Esta es una respuesta de demostración. Para obtener sugerencias personalizadas con tus ingredientes reales, configurá tu API key de OpenAI en el archivo .env del backend."
  };
}

// GET conversation history
router.get('/history', (req, res) => {
  try {
    const db = getDb();
    const history = db.prepare('SELECT * FROM ai_conversations ORDER BY created_at DESC LIMIT 20').all();
    res.json({ success: true, data: history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

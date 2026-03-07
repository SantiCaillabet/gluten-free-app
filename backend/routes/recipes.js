const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { getDb } = require('../models/database');
const { recipeUpload } = require('../middleware/upload');

// GET all recipes
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { search, difficulty, category, sort } = req.query;

    let query = `
      SELECT r.*,
        (SELECT filename FROM recipe_photos WHERE recipe_id = r.id LIMIT 1) as cover_photo,
        (SELECT COUNT(*) FROM recipe_photos WHERE recipe_id = r.id) as photo_count
      FROM recipes r
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (r.name LIKE ? OR r.ingredients LIKE ? OR r.category LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s);
    }
    if (difficulty) {
      query += ` AND r.difficulty = ?`;
      params.push(difficulty);
    }
    if (category) {
      query += ` AND r.category LIKE ?`;
      params.push(`%${category}%`);
    }

    const sortMap = {
      'name_asc': 'r.name ASC',
      'newest': 'r.created_at DESC',
      'oldest': 'r.created_at ASC',
      'prep_time_asc': 'r.prep_time ASC',
    };
    query += ` ORDER BY ${sortMap[sort] || 'r.created_at DESC'}`;

    const recipes = db.prepare(query).all(...params);
    res.json({ success: true, data: recipes, total: recipes.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single recipe
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(req.params.id);
    if (!recipe) return res.status(404).json({ success: false, error: 'Receta no encontrada' });

    const photos = db.prepare('SELECT * FROM recipe_photos WHERE recipe_id = ? ORDER BY created_at ASC').all(req.params.id);
    
    // Parse ingredients and instructions if stored as JSON
    let parsedRecipe = { ...recipe, photos };
    try {
      if (recipe.ingredients && recipe.ingredients.startsWith('[')) {
        parsedRecipe.ingredients_list = JSON.parse(recipe.ingredients);
      }
      if (recipe.instructions && recipe.instructions.startsWith('[')) {
        parsedRecipe.instructions_list = JSON.parse(recipe.instructions);
      }
    } catch(e) {}

    res.json({ success: true, data: parsedRecipe });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create recipe
router.post('/', recipeUpload.array('photos', 10), (req, res) => {
  try {
    const db = getDb();
    const { name, ingredients, instructions, prep_time, cook_time, servings, difficulty, category, notes } = req.body;

    if (!name || !ingredients || !instructions) {
      return res.status(400).json({ success: false, error: 'Nombre, ingredientes e instrucciones son requeridos' });
    }

    const result = db.prepare(`
      INSERT INTO recipes (name, ingredients, instructions, prep_time, cook_time, servings, difficulty, category, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      name, ingredients, instructions,
      parseInt(prep_time) || null, parseInt(cook_time) || null,
      parseInt(servings) || null, difficulty || 'medio',
      category || null, notes || null
    );

    const recipeId = result.lastInsertRowid;

    if (req.files && req.files.length > 0) {
      const insertPhoto = db.prepare('INSERT INTO recipe_photos (recipe_id, filename, original_name) VALUES (?, ?, ?)');
      req.files.forEach(file => insertPhoto.run(recipeId, file.filename, file.originalname));
    }

    const newRecipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(recipeId);
    const photos = db.prepare('SELECT * FROM recipe_photos WHERE recipe_id = ?').all(recipeId);
    res.status(201).json({ success: true, data: { ...newRecipe, photos } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update recipe
router.put('/:id', recipeUpload.array('photos', 10), (req, res) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM recipes WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ success: false, error: 'Receta no encontrada' });

    const { name, ingredients, instructions, prep_time, cook_time, servings, difficulty, category, notes } = req.body;

    db.prepare(`
      UPDATE recipes SET
        name = ?, ingredients = ?, instructions = ?, prep_time = ?, cook_time = ?,
        servings = ?, difficulty = ?, category = ?, notes = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      name || existing.name,
      ingredients !== undefined ? ingredients : existing.ingredients,
      instructions !== undefined ? instructions : existing.instructions,
      prep_time !== undefined ? parseInt(prep_time) : existing.prep_time,
      cook_time !== undefined ? parseInt(cook_time) : existing.cook_time,
      servings !== undefined ? parseInt(servings) : existing.servings,
      difficulty || existing.difficulty,
      category !== undefined ? category : existing.category,
      notes !== undefined ? notes : existing.notes,
      req.params.id
    );

    if (req.files && req.files.length > 0) {
      const insertPhoto = db.prepare('INSERT INTO recipe_photos (recipe_id, filename, original_name) VALUES (?, ?, ?)');
      req.files.forEach(file => insertPhoto.run(req.params.id, file.filename, file.originalname));
    }

    const updated = db.prepare('SELECT * FROM recipes WHERE id = ?').get(req.params.id);
    const photos = db.prepare('SELECT * FROM recipe_photos WHERE recipe_id = ?').all(req.params.id);
    res.json({ success: true, data: { ...updated, photos } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE recipe
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM recipes WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ success: false, error: 'Receta no encontrada' });

    const photos = db.prepare('SELECT * FROM recipe_photos WHERE recipe_id = ?').all(req.params.id);
    photos.forEach(photo => {
      const filePath = path.join(__dirname, '..', 'uploads', 'recipes', photo.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    db.prepare('DELETE FROM recipes WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Receta eliminada correctamente' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE recipe photo
router.delete('/:id/photos/:photoId', (req, res) => {
  try {
    const db = getDb();
    const photo = db.prepare('SELECT * FROM recipe_photos WHERE id = ? AND recipe_id = ?').get(req.params.photoId, req.params.id);
    if (!photo) return res.status(404).json({ success: false, error: 'Foto no encontrada' });

    const filePath = path.join(__dirname, '..', 'uploads', 'recipes', photo.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    db.prepare('DELETE FROM recipe_photos WHERE id = ?').run(req.params.photoId);
    res.json({ success: true, message: 'Foto eliminada' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

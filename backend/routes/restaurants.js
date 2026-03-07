const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const { getDb } = require('../models/database');
const { restaurantUpload } = require('../middleware/upload');

// GET all restaurants
router.get('/', (req, res) => {
  try {
    const db = getDb();
    const { search, gluten_level, food_type, city, sort } = req.query;

    let query = `
      SELECT r.*,
        (SELECT filename FROM restaurant_photos WHERE restaurant_id = r.id LIMIT 1) as cover_photo,
        (SELECT COUNT(*) FROM restaurant_photos WHERE restaurant_id = r.id) as photo_count
      FROM restaurants r
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      query += ` AND (r.name LIKE ? OR r.city LIKE ? OR r.address LIKE ? OR r.food_type LIKE ?)`;
      const s = `%${search}%`;
      params.push(s, s, s, s);
    }
    if (gluten_level) {
      query += ` AND r.gluten_level = ?`;
      params.push(gluten_level);
    }
    if (food_type) {
      query += ` AND r.food_type LIKE ?`;
      params.push(`%${food_type}%`);
    }
    if (city) {
      query += ` AND r.city LIKE ?`;
      params.push(`%${city}%`);
    }

    const sortMap = {
      'rating_desc': 'r.rating DESC',
      'rating_asc': 'r.rating ASC',
      'name_asc': 'r.name ASC',
      'newest': 'r.created_at DESC',
      'oldest': 'r.created_at ASC',
    };
    query += ` ORDER BY ${sortMap[sort] || 'r.created_at DESC'}`;

    const restaurants = db.prepare(query).all(...params);
    res.json({ success: true, data: restaurants, total: restaurants.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET single restaurant
router.get('/:id', (req, res) => {
  try {
    const db = getDb();
    const restaurant = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(req.params.id);
    if (!restaurant) return res.status(404).json({ success: false, error: 'Restaurante no encontrado' });

    const photos = db.prepare('SELECT * FROM restaurant_photos WHERE restaurant_id = ? ORDER BY created_at ASC').all(req.params.id);
    res.json({ success: true, data: { ...restaurant, photos } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST create restaurant
router.post('/', restaurantUpload.array('photos', 10), (req, res) => {
  try {
    const db = getDb();
    const {
      name, city, country, address, food_type, gluten_level,
      menu, price_range, notes, rating, latitude, longitude, website, phone
    } = req.body;

    if (!name || !city || !country) {
      return res.status(400).json({ success: false, error: 'Nombre, ciudad y país son requeridos' });
    }

    const result = db.prepare(`
      INSERT INTO restaurants (name, city, country, address, food_type, gluten_level, menu, price_range, notes, rating, latitude, longitude, website, phone)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(name, city, country, address || null, food_type || null, gluten_level || 'opciones_sin_gluten',
       menu || null, price_range || null, notes || null, parseFloat(rating) || 0,
       parseFloat(latitude) || null, parseFloat(longitude) || null, website || null, phone || null);

    const restaurantId = result.lastInsertRowid;

    if (req.files && req.files.length > 0) {
      const insertPhoto = db.prepare('INSERT INTO restaurant_photos (restaurant_id, filename, original_name) VALUES (?, ?, ?)');
      req.files.forEach(file => {
        insertPhoto.run(restaurantId, file.filename, file.originalname);
      });
    }

    const newRestaurant = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(restaurantId);
    const photos = db.prepare('SELECT * FROM restaurant_photos WHERE restaurant_id = ?').all(restaurantId);

    res.status(201).json({ success: true, data: { ...newRestaurant, photos } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update restaurant
router.put('/:id', restaurantUpload.array('photos', 10), (req, res) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ success: false, error: 'Restaurante no encontrado' });

    const {
      name, city, country, address, food_type, gluten_level,
      menu, price_range, notes, rating, latitude, longitude, website, phone
    } = req.body;

    db.prepare(`
      UPDATE restaurants SET
        name = ?, city = ?, country = ?, address = ?, food_type = ?, gluten_level = ?,
        menu = ?, price_range = ?, notes = ?, rating = ?, latitude = ?, longitude = ?,
        website = ?, phone = ?, updated_at = datetime('now')
      WHERE id = ?
    `).run(
      name || existing.name, city || existing.city, country || existing.country,
      address !== undefined ? address : existing.address,
      food_type !== undefined ? food_type : existing.food_type,
      gluten_level || existing.gluten_level,
      menu !== undefined ? menu : existing.menu,
      price_range !== undefined ? price_range : existing.price_range,
      notes !== undefined ? notes : existing.notes,
      rating !== undefined ? parseFloat(rating) : existing.rating,
      latitude !== undefined ? parseFloat(latitude) : existing.latitude,
      longitude !== undefined ? parseFloat(longitude) : existing.longitude,
      website !== undefined ? website : existing.website,
      phone !== undefined ? phone : existing.phone,
      req.params.id
    );

    if (req.files && req.files.length > 0) {
      const insertPhoto = db.prepare('INSERT INTO restaurant_photos (restaurant_id, filename, original_name) VALUES (?, ?, ?)');
      req.files.forEach(file => {
        insertPhoto.run(req.params.id, file.filename, file.originalname);
      });
    }

    const updated = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(req.params.id);
    const photos = db.prepare('SELECT * FROM restaurant_photos WHERE restaurant_id = ?').all(req.params.id);
    res.json({ success: true, data: { ...updated, photos } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE restaurant
router.delete('/:id', (req, res) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ success: false, error: 'Restaurante no encontrado' });

    const photos = db.prepare('SELECT * FROM restaurant_photos WHERE restaurant_id = ?').all(req.params.id);
    photos.forEach(photo => {
      const filePath = path.join(__dirname, '..', 'uploads', 'restaurants', photo.filename);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    db.prepare('DELETE FROM restaurants WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Restaurante eliminado correctamente' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE a specific photo
router.delete('/:id/photos/:photoId', (req, res) => {
  try {
    const db = getDb();
    const photo = db.prepare('SELECT * FROM restaurant_photos WHERE id = ? AND restaurant_id = ?').get(req.params.photoId, req.params.id);
    if (!photo) return res.status(404).json({ success: false, error: 'Foto no encontrada' });

    const filePath = path.join(__dirname, '..', 'uploads', 'restaurants', photo.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    db.prepare('DELETE FROM restaurant_photos WHERE id = ?').run(req.params.photoId);
    res.json({ success: true, message: 'Foto eliminada' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

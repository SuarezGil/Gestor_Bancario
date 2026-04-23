import Favorite from './favorite.model.js';

export const addFavorite = async (req, res) => {
  try {
    const { cuenta, tipo, alias } = req.body;
    const usuario = req.userId;

    if (!usuario) {
      return res.status(400).json({ success: false, message: 'usuario es requerido' });
    }

    const existingFavorite = await Favorite.findOne({ usuario, cuenta });
    if (existingFavorite) {
      return res.status(409).json({
        success: false,
        message: 'La cuenta ya esta agregada en favoritos'
      });
    }

    const fav = await Favorite.create({ usuario, cuenta, tipo, alias });
    return res.status(201).json({ success: true, favorite: fav });
  } catch (err) {
    if (err?.code === 11000) {
      return res.status(409).json({
        success: false,
        message: 'La cuenta ya esta agregada en favoritos'
      });
    }

    return res.status(500).json({ success: false, error: err.message });
  }
};

export const listFavorites = async (req, res) => {
  try {
    const usuario = req.userId;

    if (!usuario) {
      return res.status(400).json({ success: false, message: 'usuario es requerido' });
    }

    const favs = await Favorite.find({ usuario });
    return res.json({ success: true, favorites: favs });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const deleteFavorite = async (req, res) => {
  try {
    const usuario = req.userId;
    const { id } = req.params;

    if (!usuario) {
      return res.status(400).json({ success: false, message: 'usuario es requerido' });
    }

    await Favorite.deleteOne({ _id: id, usuario });
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

export const transferFromFavorite = async (req, res) => {
  try {
    const usuario = req.userId;
    const { id } = req.params;
    const { monto, moneda, descripcion } = req.body;

    if (!usuario) {
      return res.status(400).json({ success: false, message: 'usuario es requerido' });
    }

    const fav = await Favorite.findOne({ _id: id, usuario });
    if (!fav) {
      return res.status(404).json({ success: false, message: 'Favorito no encontrado' });
    }

    return res.json({
      success: true,
      message: 'Transferencia rapida preparada',
      data: {
        favorito: fav,
        monto,
        moneda,
        descripcion: descripcion || null
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
};

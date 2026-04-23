import mongoose from 'mongoose';

const FavoriteSchema = new mongoose.Schema(
  {
    usuario: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    cuenta: {
      type: String,
      required: true
    },
    tipo: {
      type: String,
      required: true
    },
    alias: {
      type: String,
      required: true
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Evita duplicados: un usuario no puede agregar la misma cuenta dos veces.
FavoriteSchema.index({ usuario: 1, cuenta: 1 }, { unique: true });

export default mongoose.model('Favorite', FavoriteSchema);

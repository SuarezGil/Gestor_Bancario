'use strict';

import { Schema, model } from 'mongoose';

const favoriteSchema = new Schema(
  {
    userId: {
      type: String,
      required: [true, 'El ID del usuario es requerido']
    },
    cuenta: {
      type: String,
      required: [true, 'El número de cuenta es requerido']
    },
    tipo: {
      type: String,
      required: [true, 'El tipo de cuenta es requerido']
    },
    alias: {
      type: String,
      required: [true, 'El alias de la cuenta es requerido']
    }
  },
  {
    timestamps: true,
    versionKey: false
  }
);

// Evita duplicados: un usuario no puede agregar la misma cuenta dos veces.
favoriteSchema.index({ userId: 1, cuenta: 1 }, { unique: true });

export default model('Favorite', favoriteSchema);

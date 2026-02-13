'use strict';

import mongoose from "mongoose";

const userSchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'El nombre es requerido'],
            trim: true,
            maxlength: [100, 'El nombre no puede exceder 100 caracteres']
        },
        email: {
            type: String,
            required: [true, 'El email es requerido'],
            trim: true,
            lowercase: true,
            unique: true
        },
        password: {
            type: String,
            required: [true, 'La contraseña es requerida'],
            select: false
        },
        isActive: {
            type: Boolean,
            default: true
        },
        imagen : {
            type: String,
            default : null
        },
        fecha_registro: {
            type: Date,
            default: Date.now
        },
        fecha_actualizacion: {
            type: Date,
            default: null
        }
    },
    {
        versionKey: false
    }
);

// Índices
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ isActive: 1 });

export default mongoose.model('User', userSchema);

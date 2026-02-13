'use strict';

import mongoose from "mongoose";

const accountSchema = mongoose.Schema(
    {
        usuarioId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'El usuario es requerido']
        },
        numeroCuenta: {
            type: String,
            required: [true, 'El número de cuenta es requerido'],
            unique: true,
            trim: true,
            maxlength: [30, 'El número de cuenta no puede exceder 30 caracteres']
            // Opcional si solo quieres números:
            // match: [/^\d+$/, 'El número de cuenta solo debe contener números']
        },
        tipoCuenta: {
            type: String,
            required: [true, 'El tipo de cuenta es requerido'],
            enum: {
                values: ['AHORRO', 'MONETARIA'],
                message: 'Tipo de cuenta no válido'
            }
        },
        saldo: {
            type: Number,
            set: v => v != null ? Number(parseFloat(v).toFixed(2)) : v,
            required: [true, 'El saldo es requerido'],
            min: [0, 'El saldo no puede ser negativo']
        },
        moneda: {
            type: String,
            required: [true, 'La moneda es requerida'],
            enum: {
                values: ['GTQ', 'USD'],
                message: 'Moneda no válida'
            }
        },
        estado: {
            type: Boolean,
            default: true
        },
        fechaCreacion: {
            type: Date,
            default: Date.now
        },
        fechaModificacion: {
            type: Date,
            default: null
        }
    },
    {
        versionKey: false
    }
);

// Índices
accountSchema.index({ numeroCuenta: 1 }, { unique: true });
accountSchema.index({ usuarioId: 1 });
accountSchema.index({ estado: 1 });
accountSchema.index({ usuarioId: 1, estado: 1 });

export default mongoose.model('Account', accountSchema);
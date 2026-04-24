'use strict';

import { Schema, model } from 'mongoose';

const accountSchema = new Schema(
    {
        userId: {
            type: String,
            required: [true, 'El id del usuario es requerido']
        },
        numeroCuenta: {
            type: String,
            trim: true,
            maxlength: [10, 'El número de cuenta no puede exceder 10 caracteres']
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
                values: ['GTQ', 'USD', 'EUR', 'MXN', 'COP', 'JPY'],
                message: 'Moneda no válida'
            }
        },
        estado: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true,
        versionKey: false
    }
);

// Índices
accountSchema.index({ numeroCuenta: 1 }, { unique: true });
accountSchema.index({ userId: 1 });
accountSchema.index({ estado: 1 });
accountSchema.index({ userId: 1, estado: 1 });

const generateAccountNumber = () => {
    const min = 1_000_000_000; // 10 dígitos
    const max = 9_999_999_999;
    return String(Math.floor(Math.random() * (max - min + 1)) + min);
};

accountSchema.pre('validate', async function () {
    if (this.numeroCuenta) return;

    let generated;
    let exists = true;

    while (exists) {
        generated = generateAccountNumber();
        // Verificar unicidad
        // eslint-disable-next-line no-await-in-loop
        exists = await this.constructor.exists({ numeroCuenta: generated });
    }

    this.numeroCuenta = generated;
});

export default model('Account', accountSchema);
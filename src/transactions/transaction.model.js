"use strict";
 
import { Schema, model } from 'mongoose';
 
const transactionSchema = new Schema(
    {
        tipoTransaccion: {
            type: String,
            required: [true, "El tipo de transacción es requerido"],
            enum: {
                values: ["DEPOSITO", "TRANSFERENCIA", "RETIRO"],
                message: "Tipo de transacción no válido"
            }
        },
        cuentaOrigen: {
            type: String,
            default: null
        },
        cuentaDestino: {
            type: String,
            default: null
        },
        monto: {
            type: Number,
            set: v => v != null ? Number(parseFloat(v).toFixed(2)) : v,
            required: [true, "El monto es requerido"],
            min: [0.01, "El monto debe ser mayor a 0"]
        },
        moneda: {
            type: String,
            required: [true, "La moneda es requerida"],
            enum: {
                values: ["GTQ", "USD", "EUR", "MXN", "COP", "JPY"],
                message: "Moneda no válida"
            }
        },
        descripcion: {
            type: String,
            default: null,
            trim: true,
            maxlength: [100, "La descripción no puede exceder 100 caracteres"]
        },
        estado: {
            type: String,
            enum: {
                values: ["COMPLETADA", "CANCELADA"]
            },
            default: "COMPLETADA"
        }
    },
    {
        timestamps: true,
        versionKey: false,
        toJSON: {
            virtuals: true,
            transform: function(doc, ret) {
                ret.id = ret._id;
                delete ret._id;
                return ret;
            }
        }
    }
);
 
// Índices
transactionSchema.index({ tipoTransaccion: 1 });
transactionSchema.index({ cuentaOrigen: 1 });
transactionSchema.index({ cuentaDestino: 1 });
transactionSchema.index({ fechaTransaccion: 1 });
transactionSchema.index({ estado: 1 });
transactionSchema.index({ cuentaOrigen: 1, fechaTransaccion: -1 });
transactionSchema.index({ cuentaDestino: 1, fechaTransaccion: -1 });
 
export default model("Transaction", transactionSchema);
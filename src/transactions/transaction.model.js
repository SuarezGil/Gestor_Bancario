"use strict";
 
import mongoose from "mongoose";
 
const transactionSchema = mongoose.Schema(
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
            type: mongoose.Schema.Types.ObjectId,
            ref: "Account",
            default: null
        },
        cuentaDestino: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Account",
            default: null
        },
        monto: {
            type: Number,
            set: v => v != null ? Number(parseFloat(v).toFixed(2)) : v,
            required: [true, "El monto es requerido"],
            min: [0.01, "El monto debe ser mayor a 0"],
            max: [2000, "El monto no debe ser mayor a 2000"]
        },
        moneda: {
            type: String,
            required: [true, "La moneda es requerida"],
            enum: {
                values: ["GTQ", "USD"],
                message: "Moneda no válida"
            }
        },
        descripcion: {
            type: String,
            required: [true, "La descripción es requerida"],
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
        versionKey: false
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
 
export default mongoose.model("Transaction", transactionSchema);
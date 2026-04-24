'use strict';

import { body } from 'express-validator';


export const validateCreateAccount = [
    // numeroCuenta se genera automáticamente
    // ========================
    // userId
    // ========================
    body('userId')
        .notEmpty().withMessage('El ID del usuario es requerido'),

    body('tipoCuenta')
        .notEmpty().withMessage('El tipo de cuenta es requerido')
        .isIn(['AHORRO', 'MONETARIA'])
        .withMessage('Tipo de cuenta no válido'),

    // ========================
    // saldo
    // ========================
    body('saldo')
        .notEmpty().withMessage('El saldo es requerido')
        .isFloat({ min: 0 })
        .withMessage('El saldo no puede ser negativo'),

    // ========================
    // moneda
    // ========================
    body('moneda')
        .notEmpty().withMessage('La moneda es requerida')
        .isIn(['GTQ', 'USD', 'EUR', 'MXN', 'COP', 'JPY'])
        .withMessage('Moneda no válida'),

    // ========================
    // estado (opcional)
    // ========================
    body('estado')
        .optional()
        .isBoolean()
        .withMessage('El estado debe ser true o false'),

    // ========================
    // Fin de validaciones
    // ========================
];

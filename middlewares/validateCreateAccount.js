'use strict';

import { body } from 'express-validator';
import { validateErrors } from './validateErrors.js';
import Account from '../src/accounts/account.model.js';


export const validateCreateAccount = [

    // ========================
    // usuarioId
    // ========================
    body('usuarioId')
        .notEmpty().withMessage('El usuario es requerido')
        .isMongoId().withMessage('El usuario debe ser un ID válido'),

    // ========================
    // numeroCuenta
    // ========================
    body('numeroCuenta')
        .notEmpty().withMessage('El número de cuenta es requerido')
        .isLength({ max: 30 })
        .withMessage('El número de cuenta no puede exceder 30 caracteres')
        .trim()
        .custom(async (value) => {

            // Validar si ya existe
            const account = await Account.findOne({ numeroCuenta: value });

            if (account) {
                throw new Error('El número de cuenta ya existe');
            }

            return true;
        }),

    // ========================
    // tipoCuenta
    // ========================
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
        .isIn(['GTQ', 'USD'])
        .withMessage('Moneda no válida'),

    // ========================
    // estado (opcional)
    // ========================
    body('estado')
        .optional()
        .isBoolean()
        .withMessage('El estado debe ser true o false'),

    // ========================
    // Ejecutar validaciones
    // ========================
    validateErrors
];

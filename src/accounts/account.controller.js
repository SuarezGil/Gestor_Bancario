'use strict';

import Account from './account.model.js';

/**
 * CREAR CUENTA
 */
export const createAccount = async (req, res) => {
    try {

        const accountData = req.body;

        // Crear instancia del modelo
        const account = new Account(accountData);

        // Guardar en la BD
        await account.save();

        res.status(201).json({
            success: true,
            message: 'Cuenta creada exitosamente',
            data: account
        });

    } catch (error) {

        res.status(400).json({
            success: false,
            message: 'Error al crear la cuenta',
            error: error.message
        });

    }
};


/**
 * OBTENER CUENTAS (Paginadas)
 */
export const getAccounts = async (req, res) => {
    try {

        const { page = 1, limit = 10, estado = true } = req.query;

        // Filtro
        const filter = { estado };

        // Opciones
        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { fechaCreacion: -1 }
        };

        // Buscar cuentas
        const accounts = await Account.find(filter)
            .populate('usuarioId', 'name email') // Trae datos del usuario
            .limit(options.limit)
            .skip((page - 1) * limit)
            .sort(options.sort);

        // Total
        const total = await Account.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: accounts,
            pagination: {
                currentPage: Number(page),
                totalPages: Math.ceil(total / limit),
                totalRecords: total,
                limit: Number(limit)
            }
        });

    } catch (error) {

        res.status(500).json({
            success: false,
            message: 'Error al obtener las cuentas',
            error: error.message
        });

    }
};



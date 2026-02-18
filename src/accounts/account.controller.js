'use strict';

import Account from './account.model.js';

/**
 * CREAR CUENTA
 */
export const createAccount = async (req, res) => {
    try {

        const accountData = {
            ...req.body,
            userId: req.userId,
            estado: true
        };

        // Crear instancia del modelo
        const account = new Account(accountData);

        // Guardar en la BD
        await account.save();

        const accountResponse = account.toObject();
        delete accountResponse._id;

        res.status(201).json({
            success: true,
            message: 'Cuenta creada exitosamente',
            data: accountResponse
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

        const pageNumber = Math.max(parseInt(page, 10) || 1, 1);
        const limitNumber = Math.max(parseInt(limit, 10) || 10, 1);

        const estadoValue = typeof estado === 'string'
            ? estado.toLowerCase() === 'true'
            : estado;

        // Filtro
        const filter = {
            estado: estadoValue,
            usuarioId: req.userId
        };

        // Opciones
        const options = {
            page: pageNumber,
            limit: limitNumber,
            sort: { fechaCreacion: -1 }
        };

        // Buscar cuentas
        const accounts = await Account.find(filter)
            .select('-_id')
            .limit(options.limit)
            .skip((pageNumber - 1) * limitNumber)
            .sort(options.sort);

        // Total
        const total = await Account.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: accounts,
            pagination: {
                currentPage: pageNumber,
                totalPages: Math.ceil(total / limitNumber),
                totalRecords: total,
                limit: limitNumber
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



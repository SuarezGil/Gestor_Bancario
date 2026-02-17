'use strict';

import { Router } from 'express';

import {
    createAccount,
    getAccounts,
    updateAccount,
    deleteAccount
} from './account.controller.js';

const router = Router();

// Crear
router.post('/account/create', createAccount);

// Listar
router.get('/account/get', getAccounts);

// Actualizar
router.put('/account/update/:id', updateAccount);

// Eliminar (soft delete)
router.delete('/account/delete/:id', deleteAccount);

export default router;

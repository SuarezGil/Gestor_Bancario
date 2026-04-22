import { Router } from 'express';
import { createTransaction } from './transaction.controller.js';
import { validateTransaction } from '../../middlewares/transaction.middleware.js';

const router = Router();

router.post(
    '/create',
    validateTransaction,
    createTransaction
);

export default router;

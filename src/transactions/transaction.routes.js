import { Router } from 'express';
import { createTransaction, updateTransaction, getTransactions, getTransactionsById } from './transaction.controller.js';
import { validateTransaction } from '../../middlewares/transaction.middleware.js';

const router = Router();

router.post(
    '/create',
    validateTransaction,
    createTransaction
);

router.put(
    '/update/:id',
    updateTransaction
);

router.get(
    '/get',
    getTransactions,
);

router.get(
    '/get/:id',
    getTransactionsById
)




export default router;


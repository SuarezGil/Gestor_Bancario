import { Router } from 'express';
import { createTransaction, updateTransaction, getTransactions, getTransactionsById } from './transaction.controller.js';
import { validateTransaction } from '../../middlewares/transaction.middleware.js';
import currencyConversionMiddleware from '../../middlewares/currencyConversion.js';

const router = Router();

router.post(
    '/create',
    validateTransaction,
    currencyConversionMiddleware,
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


import { Router } from 'express';
import { createTransaction, updateTransaction, getTransactions, getTransactionsById } from './transaction.controller.js';
import { validateTransaction } from '../../middlewares/transaction.middleware.js';
import requireDescriptionForTransaction from '../../middlewares/requireDescriptionForTransaction.js';
import currencyConversionMiddleware from '../../middlewares/currencyConversion.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';

const router = Router();

router.post(
    '/create',
    validateJWT,
    validateTransaction,
    requireDescriptionForTransaction,
    currencyConversionMiddleware,
    createTransaction
);

router.put(
    '/update/:id',
    validateJWT,
    updateTransaction
);

router.get(
    '/get',
    validateJWT,
    getTransactions,
);

router.get(
    '/get/:id',
    validateJWT,
    getTransactionsById
)




export default router;


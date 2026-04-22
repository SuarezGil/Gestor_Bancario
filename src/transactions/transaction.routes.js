import { Router } from 'express';
import { createTransaction, updateTransaction, getTransactions, getTransactionsById, deleteTransaction } from './transaction.controller.js';
import { validateTransaction } from '../../middlewares/transaction.middleware.js';
import requireDescriptionForTransaction from '../../middlewares/requireDescriptionForTransaction.js';
import currencyConversionMiddleware from '../../middlewares/currencyConversion.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';
import parseFormData from '../../middlewares/parseFormData.js';

const router = Router();

router.post(
    '/create',
    validateJWT,
    parseFormData,
    validateTransaction,
    requireDescriptionForTransaction,
    currencyConversionMiddleware,
    createTransaction
);

router.put(
    '/update/:id',
    validateJWT,
    parseFormData,
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

router.delete(
    '/delete/:id',
    validateJWT,
    deleteTransaction
)




export default router;


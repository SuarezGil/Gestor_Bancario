'use strict';

import { Router } from 'express';
const router = Router();

import {
    createAccount,
    getAccounts
} from './account.controller.js';

import { validateCreateAccount } from '../../middlewares/validateCreateAccount.js';


router.post(
    '/account/create',
    validateCreateAccount,
    createAccount
);

router.get(
    '/account/get',
    getAccounts
);

export default router;

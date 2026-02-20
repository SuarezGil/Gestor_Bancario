'use strict';

import { Router } from 'express';
const router = Router();

import {
    createAccount,
    getAccounts
} from './account.controller.js';

import { validateCreateAccount } from '../../middlewares/validateCreateAccount.js';
import { validateJWT } from '../../middlewares/validate-JWT.js';


router.post(
    '/account/create',
    validateJWT,
    validateCreateAccount,
    createAccount
);

router.get(
    '/account/get',
    validateJWT,
    getAccounts
);

export default router;

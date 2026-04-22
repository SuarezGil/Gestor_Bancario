'use strict';

import { Router } from 'express';
const router = Router();

import {
    createAccount,
    getAccounts
} from './account.controller.js';

import { validateCreateAccount } from '../../middlewares/validateCreateAccount.js';
import { validateJWT, isAdmin } from '../../middlewares/validate-JWT.js';
import { validateUserFromBody } from '../../middlewares/validate-UserJWT.js';
import parseFormData from '../../middlewares/parseFormData.js';


router.post(
    '/account/create',
    validateJWT,
    parseFormData,
    isAdmin,
    validateUserFromBody,
    validateCreateAccount,
    createAccount
);

router.get(
    '/account/get',
    validateJWT,
    getAccounts
);

export default router;

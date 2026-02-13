'use strict';

import { Router } from 'express';

import {
    createAccount,
    getAccounts
} from './account.controller.js';



const router = Router();


router.post(
    '/account/create',
    
    createAccount
);

router.get(
    '/account/get',
    getAccounts
);

export default router;

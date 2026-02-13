'use strict';

import { Router } from 'express';

import {
    createAccount,
    getAccounts
} from './account.controller.js';



const router = Router();


router.post(
    '/create',
    
    createAccount
);

router.get(
    '/get',
    getAccounts
);

export default router;

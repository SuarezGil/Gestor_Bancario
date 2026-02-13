import { Router } from "express";
import { createUser, getUsers } from "./user.controller.js";
import { uploadUserImage } from "../../middlewares/file-uploader.js";

const router = Router();

router.post(
    '/create',
    uploadUserImage.single('image'),
    createUser
);

router.get(
    '/get',
    getUsers
);

export default router;

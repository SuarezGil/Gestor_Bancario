import User from './user.model.js';

export const createUser = async (req, res) => {
    try {
        const userData = req.body;

        // Si viene una imagen desde multer + cloudinary
        if (req.file) {
            userData.imagen = req.file.path;
        }

        const user = new User(userData);
        await user.save();

        const userResponse = user.toObject();
        delete userResponse._id;

        res.status(201).json({
            success: true,
            message: 'Usuario creado exitosamente',
            data: userResponse
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al crear usuario',
            error: error.message
        });
    }
};

export const getUsers = async (req, res) => {
    try {
        let { page = 1, limit = 10, isActive = true } = req.query;

        page = parseInt(page);
        limit = parseInt(limit);
        isActive = (isActive === 'false') ? false : true;

        const filter = { isActive };

        const users = await User.find(filter)
            .select('-_id')
            .limit(limit)
            .skip((page - 1) * limit)
            .sort({ fecha_registro: -1 });

        const total = await User.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: users,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalRecords: total,
                limit
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener los usuarios',
            error: error.message
        });
    }
};
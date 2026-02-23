import jwt from "jsonwebtoken";

export const validateUserFromBody = (req, res, next) => {
    try {
        const tokenUsuario = req.body.tokenUsuario;

        if (!tokenUsuario) {
            return res.status(400).json({
                success: false,
                message: "El token del usuario es requerido",
            });
        }

        const decoded = jwt.verify(tokenUsuario, process.env.JWT_SECRET, {
            issuer: process.env.JWT_ISSUER,
            audience: process.env.JWT_AUDIENCE,
        });

        req.targetUserId = decoded.sub;
        next();
    } catch (error) {
        let message = "Token de usuario inválido";
        if (error.name === "TokenExpiredError") message = "Token de usuario expirado";

        return res.status(401).json({ success: false, message, error: error.message });
    }
};
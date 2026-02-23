import jwt from "jsonwebtoken";

export const validateUserJWT = (req, res, next) => {
    try {
        let token =
            req.header("x-token") ||
            req.header("authorization") ||
            req.query.token;

        if (!token) {
            return res.status(401).json({
                success: false,
                message: "No hay token en la petición",
            });
        }

        token = token.replace(/^Bearer\s+/, "");

        const decoded = jwt.verify(token, process.env.JWT_SECRET, {
            issuer: process.env.JWT_ISSUER,
            audience: process.env.JWT_AUDIENCE,
        });

        req.userId = decoded.sub;
        req.userRole = decoded.role;

        next();
    } catch (error) {
        let message = "Token inválido";
        if (error.name === "TokenExpiredError") message = "Token expirado";

        return res.status(401).json({ success: false, message, error: error.message });
    }
};

export const isAdmin = (req, res, next) => {
    if (req.userRole !== "ADMIN_ROLE") {
        return res.status(403).json({
            success: false,
            message: "No tienes permisos para esta acción",
        });
    }
    next();
};

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
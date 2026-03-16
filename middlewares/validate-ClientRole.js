export const validateClientRole = (req, res, next) => {
  const clientRoles = new Set(['USER_ROLE', 'CLIENT_ROLE', 'CLIENTE']);

  if (!req.userRole || !clientRoles.has(req.userRole)) {
    return res.status(403).json({ success: false, message: 'Solo clientes pueden acceder a favoritos.' });
  }

  next();
};

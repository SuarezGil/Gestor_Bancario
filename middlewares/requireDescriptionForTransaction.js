"use strict";

// Middleware: si la transacción es DEPOSITO o TRANSFERENCIA, la descripción es obligatoria
export const requireDescriptionForTransaction = (req, res, next) => {
  try {
    const { tipoTransaccion, descripcion } = req.body;
    if (!tipoTransaccion) return next();

    const normalized = String(tipoTransaccion).toUpperCase();
    const needsDescription = normalized === 'DEPOSITO' || normalized === 'TRANSFERENCIA';

    if (needsDescription) {
      if (descripcion == null) {
        return res.status(400).json({ success: false, message: 'La descripción es requerida para depósitos y transferencias' });
      }

      if (typeof descripcion !== 'string' || descripcion.trim() === '') {
        return res.status(400).json({ success: false, message: 'La descripción no puede estar vacía' });
      }
    }

    return next();
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Error en validación de descripción', error: err.message });
  }
};

export default requireDescriptionForTransaction;

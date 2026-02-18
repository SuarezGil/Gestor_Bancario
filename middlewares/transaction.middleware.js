import Account from '../src/accounts/account.model.js';

export const validateTransaction = async (req, res, next) => {
    try {
        const { tipoTransaccion, monto, moneda, cuentaOrigen, cuentaDestino } = req.body;

        if (!tipoTransaccion || !monto || !moneda) {
            return res.status(400).json({ success: false, message: 'tipoTransaccion, monto y moneda son obligatorios' });
        }

        const normalizedType = String(tipoTransaccion).toUpperCase();
        const validTypes = ['DEPOSITO', 'TRANSFERENCIA', 'RETIRO'];
        if (!validTypes.includes(normalizedType)) {
            return res.status(400).json({ success: false, message: 'tipoTransaccion inválido' });
        }

        if (monto <= 0) {
            return res.status(400).json({ success: false, message: 'El monto debe ser mayor a 0' });
        }

        const validCurrencies = ['GTQ', 'USD'];
        if (!validCurrencies.includes(String(moneda).toUpperCase())) {
            return res.status(400).json({ success: false, message: 'moneda inválida' });
        }

        if (normalizedType === 'TRANSFERENCIA') {
            if (!cuentaOrigen) return res.status(400).json({ success: false, message: 'cuentaOrigen es obligatoria para transferencias' });
            if (!cuentaDestino) return res.status(400).json({ success: false, message: 'cuentaDestino es obligatoria para transferencias' });

            const origin = await Account.findById(cuentaOrigen);
            const destination = await Account.findById(cuentaDestino);

            if (!origin || !destination) return res.status(404).json({ success: false, message: 'Cuenta origen o destino no encontrada' });
            // Validar que el usuario autenticado sea el dueño de la cuenta de origen
            if (String(origin.userId) !== String(req.userId)) {
                return res.status(403).json({ success: false, message: 'No tienes permiso para operar con la cuenta de origen' });
            }
            if (origin.saldo < monto) return res.status(400).json({ success: false, message: 'Saldo insuficiente en la cuenta origen' });

        } else if (normalizedType === 'DEPOSITO') {
            if (!cuentaDestino) return res.status(400).json({ success: false, message: 'cuentaDestino es obligatoria para depósitos' });
            const destination = await Account.findById(cuentaDestino);
            if (!destination) return res.status(404).json({ success: false, message: 'Cuenta destinataria no encontrada' });
        } else if (normalizedType === 'RETIRO') {
            if (!cuentaOrigen) return res.status(400).json({ success: false, message: 'cuentaOrigen es obligatoria para retiros' });

            const origin = await Account.findById(cuentaOrigen);

            if (!origin) return res.status(404).json({ success: false, message: 'Cuenta origen no encontrada' });
            // Validar que el usuario autenticado sea el dueño de la cuenta de origen
            if (String(origin.userId) !== String(req.userId)) {
                return res.status(403).json({ success: false, message: 'No tienes permiso para operar con la cuenta de origen' });
            }
            if (origin.saldo < monto) return res.status(400).json({ success: false, message: 'Saldo insuficiente en la cuenta origen' });
        }

        next();

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error en validación de transacción', error: error.message });
    }
};

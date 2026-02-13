import Account from '../account/account.model.js';

export const validateTransaction = async (req, res, next) => {
    try {
        const { tipoTransaccion, monto, moneda, cuentaOrigen, cuentaDestino } = req.body;

        if (!tipoTransaccion || !monto || !moneda || !cuentaDestino) {
            return res.status(400).json({ success: false, message: 'tipoTransaccion, monto, moneda y cuentaDestino son obligatorios' });
        }

        const validTypes = ['DEPOSITO', 'TRANSFERENCIA'];
        if (!validTypes.includes(tipoTransaccion.toUpperCase())) {
            return res.status(400).json({ success: false, message: 'tipoTransaccion inválido' });
        }

        if (monto <= 0) {
            return res.status(400).json({ success: false, message: 'El monto debe ser mayor a 0' });
        }

        const validCurrencies = ['GTQ', 'USD'];
        if (!validCurrencies.includes(moneda.toUpperCase())) {
            return res.status(400).json({ success: false, message: 'moneda inválida' });
        }

        if (tipoTransaccion === 'TRANSFERENCIA') {
            if (!cuentaOrigen) return res.status(400).json({ success: false, message: 'cuentaOrigen es obligatoria para transferencias' });

            const origin = await Account.findById(cuentaOrigen);
            const destination = await Account.findById(cuentaDestino);

            if (!origin || !destination) return res.status(404).json({ success: false, message: 'Cuenta origen o destino no encontrada' });
            if (origin.saldo < monto) return res.status(400).json({ success: false, message: 'Saldo insuficiente en la cuenta origen' });

        } else if (tipoTransaccion === 'DEPOSITO') {
            const destination = await Account.findById(cuentaDestino);
            if (!destination) return res.status(404).json({ success: false, message: 'Cuenta destinataria no encontrada' });
        }

        next();

    } catch (error) {
        res.status(500).json({ success: false, message: 'Error en validación de transacción', error: error.message });
    }
};

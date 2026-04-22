import Transaction from './transaction.model.js';
import Account from '../accounts/account.model.js';

export const createTransaction = async (req, res) => {
    try {
        const {
            tipoTransaccion,
            monto,
            moneda,
            cuentaOrigen,
            cuentaDestino,
            descripcion
        } = req.body;

        const normalizedType = String(tipoTransaccion).toUpperCase();
        const amount = Number(parseFloat(monto).toFixed(2));

        let originAccount = null;
        let destinationAccount = null;

        if (normalizedType === 'TRANSFERENCIA') {
            originAccount = await Account.findById(cuentaOrigen);
            destinationAccount = await Account.findById(cuentaDestino);

            if (!originAccount || !destinationAccount) {
                return res.status(404).json({
                    success: false,
                    message: 'Cuenta origen o destino no encontrada'
                });
            }

            if (originAccount.saldo < amount) {
                return res.status(400).json({
                    success: false,
                    message: 'Saldo insuficiente en la cuenta origen'
                });
            }

            originAccount.saldo = Number((originAccount.saldo - amount).toFixed(2));
            destinationAccount.saldo = Number((destinationAccount.saldo + amount).toFixed(2));

            await originAccount.save();
            await destinationAccount.save();
        }

        if (normalizedType === 'DEPOSITO') {
            destinationAccount = await Account.findById(cuentaDestino);

            if (!destinationAccount) {
                return res.status(404).json({
                    success: false,
                    message: 'Cuenta destinataria no encontrada'
                });
            }

            destinationAccount.saldo = Number((destinationAccount.saldo + amount).toFixed(2));
            await destinationAccount.save();
        }

        if (normalizedType === 'RETIRO') {
            originAccount = await Account.findById(cuentaOrigen);

            if (!originAccount) {
                return res.status(404).json({
                    success: false,
                    message: 'Cuenta origen no encontrada'
                });
            }

            if (originAccount.saldo < amount) {
                return res.status(400).json({
                    success: false,
                    message: 'Saldo insuficiente en la cuenta origen'
                });
            }

            originAccount.saldo = Number((originAccount.saldo - amount).toFixed(2));
            await originAccount.save();
        }

        const transaction = await Transaction.create({
            tipoTransaccion: normalizedType,
            monto: amount,
            moneda: String(moneda).toUpperCase(),
            cuentaOrigen: originAccount ? originAccount._id : null,
            cuentaDestino: destinationAccount ? destinationAccount._id : null,
            descripcion: descripcion || null
        });

        const transactionResponse = transaction.toObject();
        delete transactionResponse._id;

        res.status(201).json({
            success: true,
            message: 'Transacción creada exitosamente',
            data: transactionResponse
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error al crear transacción',
            error: error.message
        });
    }
};

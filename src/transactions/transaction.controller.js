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
export const getTransactions = async (req, res) => {

    try {
        const { page = 1, limit = 10 } = req.query;

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: -1 }
        }

        const transactions = await Transaction.find()
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort(options.sort);

        const total = await Transaction.countDocuments();

        res.status(200).json({
            success: true,
            data: transactions,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalRecords: total,
                limit
            }
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error al obtener los campos',
            error: error.message
        })
    }

};

export const getTransactionsById = async (req, res) => {
    try {
        const { id } = req.params;
        const transactions = await Transaction.findById(id);

        if (!transactions) {
            return res.status(404).json({
                success: false,
                message: `Transacción con id ${id} no encontrada`
            });
        }

        res.status(200).json({
            success: true,
            data: transactions
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Error al obtener la transacción con id ${req.params.id}`,
            error: error.message
        })
    }
};


export const updateTransaction = async (req, res) => {
    try {
        const { id } = req.params;
        const { descripcion, estado } = req.body;

        const transaction = await Transaction.findById(id);

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: `Transacción con id ${id} no encontrada`
            });
        }
        if (
            estado === "CANCELADA" &&
            transaction.estado === "COMPLETADA"
        ) {
            const cuentaOrigen = await Account.findById(transaction.cuentaOrigen);
            const cuentaDestino = await Account.findById(transaction.cuentaDestino);

            if (!cuentaOrigen || !cuentaDestino) {
                return res.status(404).json({
                    success: false,
                    message: "Cuenta no encontrada"
                });
            }

            cuentaOrigen.saldo += transaction.monto;
            cuentaDestino.saldo -= transaction.monto;

            await cuentaOrigen.save();
            await cuentaDestino.save();
        }

        if (
            estado === "CANCELADA" &&
            transaction.estado === "CANCELADA"
        ) {
            return res.status(400).json({
                success: false,
                message: "La transacción ya está cancelada"
            });
        }

        // Actualizar campos permitidos
        if (descripcion !== undefined) {
            transaction.descripcion = descripcion;
        }

        if (estado !== undefined) {
            transaction.estado = estado;
        }

        await transaction.save();

        res.status(200).json({
            success: true,
            message: "Transacción actualizada correctamente",
            data: transaction
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error al actualizar la transacción",
            error: error.message
        });
    }
};
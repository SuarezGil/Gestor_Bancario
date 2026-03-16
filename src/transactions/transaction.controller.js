import Transaction from './transaction.model.js';
import Account from '../accounts/account.model.js';
import { convert } from '../../middlewares/currencyConversion.js';

export const createTransaction = async (req, res) => {
    try {

        const {
            tipoTransaccion,
            monto,
            moneda,
            cuentaOrigen,
            cuentaDestino,
            descripcion,
            montoOrigen: middlewareMontoOrigen,
            montoDestino: middlewareMontoDestino
        } = req.body;

        const normalizedType = String(tipoTransaccion).toUpperCase();

        // montoOriginal proviene del request del usuario
        const amount = Number(parseFloat(monto).toFixed(2));

        // si el middleware de conversión ya calculó montos para origen/destino, úsalos
        const amountToDebit = middlewareMontoOrigen !== undefined ? Number(parseFloat(middlewareMontoOrigen).toFixed(2)) : amount;
        const amountToCredit = middlewareMontoDestino !== undefined ? Number(parseFloat(middlewareMontoDestino).toFixed(2)) : amount;

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

            if (originAccount.saldo < amountToDebit) {
                return res.status(400).json({
                    success: false,
                    message: 'Saldo insuficiente en la cuenta origen'
                });
            }

            originAccount.saldo = Number((originAccount.saldo - amountToDebit).toFixed(2));
            destinationAccount.saldo = Number((destinationAccount.saldo + amountToCredit).toFixed(2));

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

            destinationAccount.saldo = Number((destinationAccount.saldo + amountToCredit).toFixed(2));
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

            if (originAccount.saldo < amountToDebit) {
                return res.status(400).json({
                    success: false,
                    message: 'Saldo insuficiente en la cuenta origen'
                });
            }
            originAccount.saldo = Number((originAccount.saldo - amountToDebit).toFixed(2));
            await originAccount.save();
        }


        // Determinar si hubo conversión y registrar la tasa aplicada (si aplica)
        let tasaApplied = null;
        // ...existing code...

        // Definir originalCurrency
        const originalCurrency = typeof moneda === 'string' ? moneda.toUpperCase() : 'GTQ';

        const transaction = await Transaction.create({
            tipoTransaccion: normalizedType,
            monto: amount,
            moneda: originalCurrency,
            cuentaOrigen: originAccount ? originAccount._id : null,
            cuentaDestino: destinationAccount ? destinationAccount._id : null,
            descripcion: descripcion || null
        });

        // Preparar datos extras (solo para respuesta, no persisten)
        const appliedDebit = Number((amountToDebit).toFixed(2));
        const appliedCredit = Number((amountToCredit).toFixed(2));
        const monedaOrigenResp = originAccount ? String(originAccount.moneda).toUpperCase() : String(moneda).toUpperCase();
        const monedaDestinoResp = destinationAccount ? String(destinationAccount.moneda).toUpperCase() : String(moneda).toUpperCase();

        const transactionResponse = transaction.toObject();
        delete transactionResponse._id;

        // Mostrar 'applied' solo si hubo conversión de moneda (moneda origen != moneda destino)
        let applied = undefined;
        const isTransfer = normalizedType === 'TRANSFERENCIA';
        const isDeposit = normalizedType === 'DEPOSITO';
        const isWithdrawal = normalizedType === 'RETIRO';

        if (isTransfer && monedaOrigenResp !== monedaDestinoResp) {
            applied = {
                montoDebitado: appliedDebit,
                monedaDebitada: monedaOrigenResp,
                montoAcreditado: appliedCredit,
                monedaAcreditada: monedaDestinoResp
            };
        } else if (isDeposit && monedaDestinoResp !== String(moneda).toUpperCase()) {
            applied = {
                montoAcreditado: appliedCredit,
                monedaAcreditada: monedaDestinoResp
            };
        } else if (isWithdrawal && monedaOrigenResp !== String(moneda).toUpperCase()) {
            applied = {
                montoDebitado: appliedDebit,
                monedaDebitada: monedaOrigenResp
            };
        }

        // Añadir la tasa aplicada en el objeto 'applied' cuando corresponda
        if (applied && tasaApplied != null) {
            applied.tasa = tasaApplied;
        }

        const responsePayload = {
            success: true,
            message: 'Transacción creada exitosamente',
            data: transactionResponse
        };

        if (applied) responsePayload.applied = applied;

        res.status(201).json(responsePayload);
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
        // Validar rol de usuario
        if (req.userRole !== "ADMIN_ROLE") {
            return res.status(403).json({
                success: false,
                message: "No tienes permisos para actualizar transacciones"
            });
        }

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
            // Reversión: recalcular conversiones en tiempo de cancelación (no dependemos de campos persistidos)
            const cuentaOrigen = transaction.cuentaOrigen ? await Account.findById(transaction.cuentaOrigen) : null;
            const cuentaDestino = transaction.cuentaDestino ? await Account.findById(transaction.cuentaDestino) : null;

            if ((transaction.cuentaOrigen && !cuentaOrigen) || (transaction.cuentaDestino && !cuentaDestino)) {
                return res.status(404).json({ success: false, message: "Cuenta no encontrada" });
            }

            const tipo = transaction.tipoTransaccion;

            if (tipo === 'TRANSFERENCIA') {
                // Recalcular montos convertidos usando monto y moneda guardados en la transacción
                const mOrigen = cuentaOrigen ? convert(Number(transaction.monto), String(transaction.moneda).toUpperCase(), String(cuentaOrigen.moneda).toUpperCase()) : 0;
                const mDestino = cuentaDestino ? convert(Number(transaction.monto), String(transaction.moneda).toUpperCase(), String(cuentaDestino.moneda).toUpperCase()) : 0;

                if (cuentaOrigen) {
                    cuentaOrigen.saldo = Number((cuentaOrigen.saldo + mOrigen).toFixed(2));
                }
                if (cuentaDestino) {
                    cuentaDestino.saldo = Number((cuentaDestino.saldo - mDestino).toFixed(2));
                }

                if (cuentaOrigen) await cuentaOrigen.save();
                if (cuentaDestino) await cuentaDestino.save();
            } else if (tipo === 'DEPOSITO') {
                const mDestino = cuentaDestino ? convert(Number(transaction.monto), String(transaction.moneda).toUpperCase(), String(cuentaDestino.moneda).toUpperCase()) : 0;
                if (cuentaDestino) {
                    cuentaDestino.saldo = Number((cuentaDestino.saldo - mDestino).toFixed(2));
                    await cuentaDestino.save();
                }
            } else if (tipo === 'RETIRO') {
                const mOrigen = cuentaOrigen ? convert(Number(transaction.monto), String(transaction.moneda).toUpperCase(), String(cuentaOrigen.moneda).toUpperCase()) : 0;
                if (cuentaOrigen) {
                    cuentaOrigen.saldo = Number((cuentaOrigen.saldo + mOrigen).toFixed(2));
                    await cuentaOrigen.save();
                }
            }
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
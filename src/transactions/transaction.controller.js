import Transaction from './transaction.model.js';
import Account from '../accounts/account.model.js';
import { convert } from '../../middlewares/currencyConversion.js';

const TRANSFER_LIMIT_PER_TRANSACTION_GTQ = 2000;
const TRANSFER_DAILY_LIMIT_GTQ = 10000;
const DEPOSIT_REVERSAL_TIME_LIMIT_MS = 60 * 1000;

const getCurrentDayRange = () => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    return { startOfDay, endOfDay };
};

const getUserAccountIds = async (userId) => {
    const userAccounts = await Account.find({ userId }).select('_id');
    return userAccounts.map((account) => account._id);
};

const getDailyTransferredAmountGTQByUser = async (userId) => {
    const { startOfDay, endOfDay } = getCurrentDayRange();
    const accountIds = await getUserAccountIds(userId);

    if (accountIds.length === 0) return 0;

    const transfers = await Transaction.find({
        tipoTransaccion: 'TRANSFERENCIA',
        estado: 'COMPLETADA',
        cuentaOrigen: { $in: accountIds },
        createdAt: {
            $gte: startOfDay,
            $lte: endOfDay
        }
    }).select('monto moneda');

    return transfers.reduce((acc, transfer) => {
        const amountInGTQ = convert(
            Number(transfer.monto),
            String(transfer.moneda).toUpperCase(),
            'GTQ'
        );

        return Number((acc + amountInGTQ).toFixed(2));
    }, 0);
};

const getUserTransactionFilter = async (req) => {
    if (req.userRole === 'ADMIN_ROLE') {
        return {};
    }

    const accountIds = await getUserAccountIds(req.userId);

    if (accountIds.length === 0) {
        return { _id: null };
    }

    return {
        $or: [
            { cuentaOrigen: { $in: accountIds } },
            { cuentaDestino: { $in: accountIds } }
        ]
    };
};

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
        const amount = Number(parseFloat(monto).toFixed(2));
        const amountToDebit = middlewareMontoOrigen !== undefined
            ? Number(parseFloat(middlewareMontoOrigen).toFixed(2))
            : amount;
        const amountToCredit = middlewareMontoDestino !== undefined
            ? Number(parseFloat(middlewareMontoDestino).toFixed(2))
            : amount;

        let originAccount = null;
        let destinationAccount = null;

        if (normalizedType === 'TRANSFERENCIA') {
            const transferAmountGTQ = convert(amount, String(moneda).toUpperCase(), 'GTQ');

            if (transferAmountGTQ > TRANSFER_LIMIT_PER_TRANSACTION_GTQ) {
                return res.status(400).json({
                    success: false,
                    message: `No puede transferir más de Q${TRANSFER_LIMIT_PER_TRANSACTION_GTQ} por transacción`
                });
            }

            const transferredTodayGTQ = await getDailyTransferredAmountGTQByUser(req.userId);
            const projectedDailyTotal = Number((transferredTodayGTQ + transferAmountGTQ).toFixed(2));

            if (projectedDailyTotal > TRANSFER_DAILY_LIMIT_GTQ) {
                return res.status(400).json({
                    success: false,
                    message: `No puede transferir más de Q${TRANSFER_DAILY_LIMIT_GTQ} por día`,
                    data: {
                        transferidoHoyGTQ: transferredTodayGTQ,
                        montoSolicitadoGTQ: transferAmountGTQ,
                        totalProyectadoGTQ: projectedDailyTotal
                    }
                });
            }

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

        const appliedDebit = Number(amountToDebit.toFixed(2));
        const appliedCredit = Number(amountToCredit.toFixed(2));
        const monedaOrigenResp = originAccount ? String(originAccount.moneda).toUpperCase() : String(moneda).toUpperCase();
        const monedaDestinoResp = destinationAccount ? String(destinationAccount.moneda).toUpperCase() : String(moneda).toUpperCase();

        const transactionResponse = transaction.toObject();
        delete transactionResponse._id;

        let applied;
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
        const filter = await getUserTransactionFilter(req);

        const options = {
            page: parseInt(page),
            limit: parseInt(limit),
            sort: { createdAt: -1 }
        };

        const transactions = await Transaction.find(filter)
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .sort(options.sort);

        const total = await Transaction.countDocuments(filter);

        res.status(200).json({
            success: true,
            data: transactions,
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
            message: 'Error al obtener las transacciones',
            error: error.message
        });
    }
};

export const getTransactionsById = async (req, res) => {
    try {
        const { id } = req.params;
        const filter = await getUserTransactionFilter(req);

        const transaction = await Transaction.findById(id);

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: `Transacción con id ${id} no encontrada`
            });
        }

        if (req.userRole !== 'ADMIN_ROLE') {
            const visibleTransaction = await Transaction.findOne({ _id: id, ...filter });

            if (!visibleTransaction) {
                return res.status(403).json({
                    success: false,
                    message: 'No tienes permisos para ver esta transacción'
                });
            }
        }

        res.status(200).json({
            success: true,
            data: transaction
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Error al obtener la transacción con id ${req.params.id}`,
            error: error.message
        });
    }
};

export const updateTransaction = async (req, res) => {
    try {
        if (req.userRole !== 'ADMIN_ROLE') {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para actualizar transacciones'
            });
        }

        const { id } = req.params;
        const { descripcion, estado } = req.body;
        const normalizedEstado = estado ? String(estado).toUpperCase() : undefined;

        const transaction = await Transaction.findById(id);

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: `Transacción con id ${id} no encontrada`
            });
        }

        // =========================
        // 🔥 DEPÓSITOS
        // =========================
        if (transaction.tipoTransaccion === 'DEPOSITO') {

            // --- Caso 1: Cancelar / Revertir depósito ---
            if (normalizedEstado === 'CANCELADA') {

                if (transaction.estado === 'CANCELADA') {
                    return res.status(400).json({
                        success: false,
                        message: 'El depósito ya está cancelado'
                    });
                }

                const elapsedMs = new Date() - transaction.createdAt;
                console.log('Tiempo transcurrido ms:', elapsedMs);

                if (elapsedMs > DEPOSIT_REVERSAL_TIME_LIMIT_MS) {
                    return res.status(400).json({
                        success: false,
                        message: 'Ya pasó más de 1 minuto, no se puede revertir'
                    });
                }

                const cuentaDestino = await Account.findById(transaction.cuentaDestino);

                if (!cuentaDestino) {
                    return res.status(404).json({
                        success: false,
                        message: 'Cuenta destino no encontrada'
                    });
                }

                const montoConvertido = convert(
                    Number(transaction.monto),
                    String(transaction.moneda).toUpperCase(),
                    String(cuentaDestino.moneda).toUpperCase()
                );

                cuentaDestino.saldo = Number((cuentaDestino.saldo - montoConvertido).toFixed(2));
                await cuentaDestino.save();

                transaction.estado = 'CANCELADA';

            // --- Caso 2: Modificar monto del depósito ---
            } else if (req.body.monto !== undefined) {

                const nuevoMonto = Number(parseFloat(req.body.monto).toFixed(2));

                if (isNaN(nuevoMonto) || nuevoMonto <= 0) {
                    return res.status(400).json({
                        success: false,
                        message: 'El monto debe ser un número mayor a 0'
                    });
                }

                if (transaction.estado === 'CANCELADA') {
                    return res.status(400).json({
                        success: false,
                        message: 'No se puede modificar el monto de un depósito cancelado'
                    });
                }

                const cuentaDestino = await Account.findById(transaction.cuentaDestino);

                if (!cuentaDestino) {
                    return res.status(404).json({
                        success: false,
                        message: 'Cuenta destino no encontrada'
                    });
                }

                const montoAnteriorConvertido = convert(
                    Number(transaction.monto),
                    String(transaction.moneda).toUpperCase(),
                    String(cuentaDestino.moneda).toUpperCase()
                );

                const montoNuevoConvertido = convert(
                    nuevoMonto,
                    String(transaction.moneda).toUpperCase(),
                    String(cuentaDestino.moneda).toUpperCase()
                );

                // Revertir monto anterior y aplicar el nuevo en el saldo
                cuentaDestino.saldo = Number(
                    (cuentaDestino.saldo - montoAnteriorConvertido + montoNuevoConvertido).toFixed(2)
                );
                await cuentaDestino.save();

                transaction.monto = nuevoMonto;

            // --- Caso 3: Ninguna operación válida ---
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Para depósitos solo puede modificar el monto o cancelarlo (estado: CANCELADA)'
                });
            }

        // =========================
        // 🔥 TRANSFERENCIAS Y RETIROS
        // =========================
        } else {

            if (req.body.monto !== undefined) {
                return res.status(400).json({
                    success: false,
                    message: 'El monto no puede modificarse'
                });
            }

            if (descripcion !== undefined) {
                transaction.descripcion = descripcion;
            }

            if (normalizedEstado !== undefined) {
                transaction.estado = normalizedEstado;
            }
        }

        await transaction.save();

        return res.status(200).json({
            success: true,
            message: 'Transacción actualizada correctamente',
            data: transaction
        });

    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al actualizar la transacción',
            error: error.message
        });
    }
};

export const deleteTransaction = async (req, res) => {
    try {
        if (req.userRole !== 'ADMIN_ROLE') {
            return res.status(403).json({
                success: false,
                message: 'No tienes permisos para eliminar transacciones'
            });
        }

        const { id } = req.params;
        const transaction = await Transaction.findById(id);

        if (!transaction) {
            return res.status(404).json({
                success: false,
                message: `Transacción con id ${id} no encontrada`
            });
        }

        if (transaction.tipoTransaccion === 'DEPOSITO') {
            return res.status(405).json({
                success: false,
                message: 'Los depósitos no pueden eliminarse'
            });
        }

        await Transaction.findByIdAndDelete(id);

        return res.status(200).json({
            success: true,
            message: 'Transacción eliminada correctamente'
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Error al eliminar la transacción',
            error: error.message
        });
    }
};
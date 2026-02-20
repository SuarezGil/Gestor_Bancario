"use strict";

import Account from '../src/accounts/account.model.js';

// Tasa configurable vía env: USD_TO_GTQ. Si no se proporciona o no es numérica, usar 7.8 por defecto
const parsedRate = parseFloat(process.env.USD_TO_GTQ);
const USD_TO_GTQ = Number.isFinite(parsedRate) ? parsedRate : 7.8;

const convert = (amount, from, to) => {
  if (from === to) return Number(parseFloat(amount).toFixed(2));
  const amt = Number(amount);
  if (!Number.isFinite(amt)) return NaN;

  let result;
  const f = from.toUpperCase();
  const t = to.toUpperCase();

  if (f === 'USD' && t === 'GTQ') {
    result = amt * USD_TO_GTQ;
  } else if (f === 'GTQ' && t === 'USD') {
    result = amt / USD_TO_GTQ;
  } else {
    // Moneda desconocida o misma
    result = amt;
  }

  return Number(parseFloat(result).toFixed(2));
};

export const currencyConversionMiddleware = async (req, res, next) => {
  try {
    const { tipoTransaccion, monto, moneda, cuentaOrigen, cuentaDestino } = req.body;
    if (!tipoTransaccion || monto == null || !moneda) return next();

    const normalizedType = String(tipoTransaccion).toUpperCase();
    const originalCurrency = String(moneda).toUpperCase();
    const originalAmount = Number(parseFloat(monto));

    // Attach defaults so controller can use them if middleware not applicable
    req.body.montoOrigen = Number(parseFloat(originalAmount).toFixed(2));
    req.body.montoDestino = Number(parseFloat(originalAmount).toFixed(2));

    if (normalizedType === 'TRANSFERENCIA') {
      // Need both accounts
      const origin = await Account.findById(cuentaOrigen);
      const destination = await Account.findById(cuentaDestino);

      if (!origin || !destination) return next();

      const originCurrency = String(origin.moneda).toUpperCase();
      const destCurrency = String(destination.moneda).toUpperCase();

      // montoOrigen: amount in origin currency (to debit)
      req.body.montoOrigen = convert(originalAmount, originalCurrency, originCurrency);
      // montoDestino: amount in destination currency (to credit)
      req.body.montoDestino = convert(originalAmount, originalCurrency, destCurrency);

      // also expose currencies used for clarity
      req.body.monedaOrigen = originCurrency;
      req.body.monedaDestino = destCurrency;
    }

    if (normalizedType === 'DEPOSITO') {
      const destination = await Account.findById(cuentaDestino);
      if (!destination) return next();
      const destCurrency = String(destination.moneda).toUpperCase();
      req.body.montoDestino = convert(originalAmount, originalCurrency, destCurrency);
      req.body.monedaDestino = destCurrency;
    }

    if (normalizedType === 'RETIRO') {
      const origin = await Account.findById(cuentaOrigen);
      if (!origin) return next();
      const originCurrency = String(origin.moneda).toUpperCase();
      req.body.montoOrigen = convert(originalAmount, originalCurrency, originCurrency);
      req.body.monedaOrigen = originCurrency;
    }

    return next();
  } catch (error) {
    return res.status(500).json({ success: false, message: 'Error en conversión de moneda', error: error.message });
  }
};

export default currencyConversionMiddleware;

// Exportar la función de conversión y la tasa para uso desde controladores si se necesita
export { convert, USD_TO_GTQ };

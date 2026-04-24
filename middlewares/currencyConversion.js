import Account from '../src/accounts/account.model.js';

const parsedFallbackRate = parseFloat(process.env.USD_TO_GTQ);
const FALLBACK_USD_TO_GTQ = Number.isFinite(parsedFallbackRate) ? parsedFallbackRate : 7.8;

// Tasas aproximadas locales (base USD) para continuidad cuando APIs externas fallan.
const LOCAL_RATES_USD_BASE = {
  USD: 1,
  GTQ: FALLBACK_USD_TO_GTQ,
  EUR: 0.92,
  MXN: 16.9,
  COP: 3920,
  JPY: 149.5
};

const getLocalCrossRate = (base, target) => {
  const baseToUsd = LOCAL_RATES_USD_BASE[base];
  const targetToUsd = LOCAL_RATES_USD_BASE[target];
  if (!Number.isFinite(baseToUsd) || !Number.isFinite(targetToUsd) || baseToUsd <= 0) return NaN;

  // base -> USD -> target
  return targetToUsd / baseToUsd;
};

const getRateFromApis = async (base, target) => {
  // API principal
  try {
    const resPrimary = await fetch(`https://open.er-api.com/v6/latest/${base}`);
    const dataPrimary = await resPrimary.json();
    const ratePrimary = dataPrimary?.rates?.[target];
    if (Number.isFinite(ratePrimary)) return ratePrimary;
  } catch (error) {
    // Continue with fallback API
  }

  // API de respaldo
  try {
    const resBackup = await fetch(`https://api.exchangerate.host/latest?base=${base}&symbols=${target}`);
    const dataBackup = await resBackup.json();
    const rateBackup = dataBackup?.rates?.[target];
    if (Number.isFinite(rateBackup)) return rateBackup;
  } catch (error) {
    // Continue with local fallback
  }

  // API de respaldo 2
  try {
    const resBackup2 = await fetch(`https://api.frankfurter.app/latest?from=${base}&to=${target}`);
    const dataBackup2 = await resBackup2.json();
    const rateBackup2 = dataBackup2?.rates?.[target];
    if (Number.isFinite(rateBackup2)) return rateBackup2;
  } catch (error) {
    // Continue with local fallback
  }

  // Fallback local multimoneda para continuidad operativa.
  const localRate = getLocalCrossRate(base, target);
  if (Number.isFinite(localRate)) return localRate;

  return NaN;
};

// En Node.js v22+, fetch es global y no requiere importación.
const convert = async (amount, from, to) => {
  const amt = Number(amount);
  if (!Number.isFinite(amt)) return NaN;

  const base = String(from).toUpperCase();
  const target = String(to).toUpperCase();
  if (base === target) return Number(amt.toFixed(2));

  const rate = await getRateFromApis(base, target);
  if (!Number.isFinite(rate)) return NaN;

  return Number((amt * rate).toFixed(2));
};

export const currencyConversionMiddleware = async (req, res, next) => {
  try {
    const { tipoTransaccion, monto, moneda, cuentaOrigen, cuentaDestino } = req.body;
    if (!tipoTransaccion || monto == null || !moneda) return next();

    const type = String(tipoTransaccion).toUpperCase();
    const requestCurrency = String(moneda).toUpperCase();
    const requestAmount = Number(parseFloat(monto));

    if (!Number.isFinite(requestAmount) || requestAmount <= 0) return next();

    // Valores por defecto si no aplica conversión.
    req.body.montoOrigen = Number(requestAmount.toFixed(2));
    req.body.montoDestino = Number(requestAmount.toFixed(2));

    if (type === 'TRANSFERENCIA') {
      const origin = await Account.findOne({ numeroCuenta: cuentaOrigen });
      const destination = await Account.findOne({ numeroCuenta: cuentaDestino });
      if (!origin || !destination) return next();

      const originCurrency = String(origin.moneda).toUpperCase();
      const destinationCurrency = String(destination.moneda).toUpperCase();

      const debitAmount = await convert(requestAmount, requestCurrency, originCurrency);
      const creditAmount = await convert(requestAmount, requestCurrency, destinationCurrency);

      if (!Number.isFinite(debitAmount) || !Number.isFinite(creditAmount)) {
        return res.status(400).json({
          success: false,
          message: 'No se pudo convertir moneda para la transferencia'
        });
      }

      req.body.montoOrigen = debitAmount;
      req.body.montoDestino = creditAmount;
      req.body.monedaOrigen = originCurrency;
      req.body.monedaDestino = destinationCurrency;
      return next();
    }

    if (type === 'DEPOSITO') {
      const destination = await Account.findOne({ numeroCuenta: cuentaDestino });
      if (!destination) return next();

      const destinationCurrency = String(destination.moneda).toUpperCase();
      const creditAmount = await convert(requestAmount, requestCurrency, destinationCurrency);
      if (!Number.isFinite(creditAmount)) {
        return res.status(400).json({
          success: false,
          message: 'No se pudo convertir moneda para el deposito'
        });
      }

      req.body.montoDestino = creditAmount;
      req.body.monedaDestino = destinationCurrency;
      return next();
    }

    if (type === 'RETIRO') {
      const origin = await Account.findOne({ numeroCuenta: cuentaOrigen });
      if (!origin) return next();

      const originCurrency = String(origin.moneda).toUpperCase();
      const debitAmount = await convert(requestAmount, requestCurrency, originCurrency);
      if (!Number.isFinite(debitAmount)) {
        return res.status(400).json({
          success: false,
          message: 'No se pudo convertir moneda para el retiro'
        });
      }

      req.body.montoOrigen = debitAmount;
      req.body.monedaOrigen = originCurrency;
    }

    return next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Error en conversion de moneda',
      error: error.message
    });
  }
};

export { convert };
export default currencyConversionMiddleware;

export interface InstallmentSettings {
  maxInstallments: number;
  installmentRate2: number;
  installmentRate3: number;
}

export interface InstallmentQuote {
  count: number;
  rate: number;
  cashCents: number;
  totalCents: number;
  payments: number[];
}

export class InstallmentValidationError extends Error {}

function scaledInteger(value: number) {
  if (!Number.isFinite(value) || value < 0 || !/^\d+(?:\.\d{1,2})?$/.test(String(value))) return null;
  const [whole, fraction = ''] = String(value).split('.');
  const scaled = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  return scaled <= BigInt(Number.MAX_SAFE_INTEGER) ? Number(scaled) : null;
}

export function parseInstallmentRate(value: string): number | null {
  const normalized = value.trim().replace(',', '.');
  if (!/^\d+(?:\.\d{1,2})?$/.test(normalized)) return null;
  const rate = Number(normalized);
  return scaledInteger(rate) === null ? null : rate;
}

export function validateInstallmentSettings(settings: InstallmentSettings) {
  if (![1, 2, 3].includes(settings.maxInstallments)) {
    throw new InstallmentValidationError('Selecione parcelamento desabilitado, 2x ou 3x.');
  }
  if ([settings.installmentRate2, settings.installmentRate3].some(rate => scaledInteger(rate) === null)) {
    throw new InstallmentValidationError('Informe taxas totais válidas, não negativas, com até duas casas decimais.');
  }
}

export function cashTotalCents(price: number, quantity = 1) {
  const priceCents = scaledInteger(price);
  if (priceCents === null || priceCents > 9999999999 || !Number.isSafeInteger(quantity) || quantity < 1) {
    throw new InstallmentValidationError('Informe um preço à vista válido, com até duas casas decimais, e uma quantidade inteira positiva.');
  }
  const total = priceCents * quantity;
  if (!Number.isSafeInteger(total)) {
    throw new InstallmentValidationError('O valor total excede o limite de cálculo.');
  }
  return total;
}

export function calculateInstallments(price: number, count: number, rate: number, quantity = 1): InstallmentQuote {
  const rateBasisPoints = scaledInteger(rate);
  if (![2, 3].includes(count) || rateBasisPoints === null) {
    throw new InstallmentValidationError('Informe 2 ou 3 parcelas e uma taxa total válida.');
  }
  const cashCents = cashTotalCents(price, quantity);
  const total = (BigInt(cashCents) * (10000n + BigInt(rateBasisPoints)) + 5000n) / 10000n;
  if (total > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new InstallmentValidationError('O valor total parcelado excede o limite de cálculo.');
  }
  const totalCents = Number(total);
  const baseCents = Math.floor(totalCents / count);
  const remainder = totalCents % count;
  return {
    count,
    rate,
    cashCents,
    totalCents,
    payments: Array.from({ length: count }, (_, index) => baseCents + (index < remainder ? 1 : 0)),
  };
}

export function getInstallmentOptions(product: InstallmentSettings & { price: number }, quantity = 1) {
  try {
    validateInstallmentSettings(product);
    return Array.from({ length: product.maxInstallments - 1 }, (_, index) => {
      const count = index + 2;
      return calculateInstallments(product.price, count, count === 2 ? product.installmentRate2 : product.installmentRate3, quantity);
    });
  } catch {
    return [];
  }
}

export function formatCents(cents: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100);
}

export function summarizeInstallments(quote: InstallmentQuote) {
  const hasCentAdjustment = quote.payments.some(payment => payment !== quote.payments[0]);
  return `${quote.count}x de ${hasCentAdjustment ? 'até ' : ''}${formatCents(quote.payments[0])}`;
}

export function describeInstallmentPayments(quote: InstallmentQuote) {
  const groups: { cents: number; count: number }[] = [];
  quote.payments.forEach(cents => {
    const previous = groups[groups.length - 1];
    if (previous?.cents === cents) previous.count += 1;
    else groups.push({ cents, count: 1 });
  });
  return groups.map(group => `${group.count}x de ${formatCents(group.cents)}`).join(' + ');
}

export function describeInstallments(quote: InstallmentQuote) {
  const payments = describeInstallmentPayments(quote);
  const rate = new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 2 }).format(quote.rate);
  return `${payments} · ${quote.rate === 0 ? 'sem juros (0%)' : `com juros de ${rate}% no total`} · Total ${formatCents(quote.totalCents)}`;
}

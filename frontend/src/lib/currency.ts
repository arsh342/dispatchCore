interface CurrencyOptions {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

export function formatINR(
  amount: number,
  options: CurrencyOptions = {},
): string {
  const { minimumFractionDigits = 2, maximumFractionDigits = 2 } = options;

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);
}

/**
 * Formats a numeric amount according to Indian numbering system (e.g. ₹6,40,000)
 */
export function formatINR(amount: number, includeSymbol: boolean = true): string {
  const rounded = Math.round(amount);
  const formatted = new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(rounded);

  return includeSymbol ? `₹${formatted}` : formatted;
}

/**
 * Converts numbers into English word representation for proposal invoices
 */
export function numberToWordsINR(num: number): string {
  if (num === 0) return 'Zero Rupees Only';

  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertLessThanOneThousand(n: number): string {
    let current = '';
    if (n >= 100) {
      current += a[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      current += b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '') + ' ';
    } else if (n > 0) {
      current += a[n] + ' ';
    }
    return current;
  }

  const crore = Math.floor(num / 10000000);
  num %= 10000000;
  const lakh = Math.floor(num / 100000);
  num %= 100000;
  const thousand = Math.floor(num / 1000);
  num %= 1000;
  const remainder = Math.floor(num);

  let result = '';
  if (crore > 0) result += convertLessThanOneThousand(crore) + 'Crore ';
  if (lakh > 0) result += convertLessThanOneThousand(lakh) + 'Lakh ';
  if (thousand > 0) result += convertLessThanOneThousand(thousand) + 'Thousand ';
  if (remainder > 0) result += convertLessThanOneThousand(remainder);

  return `${result.trim()} Rupees Only`;
}

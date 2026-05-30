const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

// Indian numbering system (Thousand / Lakh / Crore) — used for INR amounts.
function toWords(n: number): string {
  if (n === 0) return ''
  if (n < 20) return ones[n] + ' '
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '') + ' '
  if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred ' + toWords(n % 100)
  if (n < 100000) return toWords(Math.floor(n / 1000)) + 'Thousand ' + toWords(n % 1000)
  if (n < 10000000) return toWords(Math.floor(n / 100000)) + 'Lakh ' + toWords(n % 100000)
  return toWords(Math.floor(n / 10000000)) + 'Crore ' + toWords(n % 10000000)
}

// International numbering system (Thousand / Million / Billion) — used for USD amounts.
function toWordsIntl(n: number): string {
  if (n === 0) return ''
  if (n < 20) return ones[n] + ' '
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '') + ' '
  if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred ' + toWordsIntl(n % 100)
  if (n < 1000000) return toWordsIntl(Math.floor(n / 1000)) + 'Thousand ' + toWordsIntl(n % 1000)
  if (n < 1000000000) return toWordsIntl(Math.floor(n / 1000000)) + 'Million ' + toWordsIntl(n % 1000000)
  return toWordsIntl(Math.floor(n / 1000000000)) + 'Billion ' + toWordsIntl(n % 1000000000)
}

export type Currency = 'INR' | 'USD'

export function numberToWords(amount: number, currency: Currency = 'INR'): string {
  const whole = Math.floor(amount)
  const frac = Math.round((amount - whole) * 100)

  if (currency === 'USD') {
    let result = 'US Dollars ' + toWordsIntl(whole).trim()
    if (frac > 0) result += ' and ' + toWordsIntl(frac).trim() + ' Cents'
    return result + ' Only.'
  }

  let result = 'Rs. ' + toWords(whole).trim()
  if (frac > 0) result += ' and ' + toWords(frac).trim() + ' Paise'
  return result + ' Only.'
}

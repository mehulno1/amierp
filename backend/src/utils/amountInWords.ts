const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

function toWords(n: number): string {
  if (n === 0) return ''
  if (n < 20) return ones[n] + ' '
  if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + ones[n % 10] : '') + ' '
  if (n < 1000) return ones[Math.floor(n / 100)] + ' Hundred ' + toWords(n % 100)
  if (n < 100000) return toWords(Math.floor(n / 1000)) + 'Thousand ' + toWords(n % 1000)
  if (n < 10000000) return toWords(Math.floor(n / 100000)) + 'Lakh ' + toWords(n % 100000)
  return toWords(Math.floor(n / 10000000)) + 'Crore ' + toWords(n % 10000000)
}

export function numberToWords(amount: number): string {
  const rupees = Math.floor(amount)
  const paise = Math.round((amount - rupees) * 100)
  let result = 'Rs. ' + toWords(rupees).trim()
  if (paise > 0) result += ' and ' + toWords(paise).trim() + ' Paise'
  return result + ' Only.'
}

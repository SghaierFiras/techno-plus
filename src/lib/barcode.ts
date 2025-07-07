// Barcode generation utilities
export function generateBarcode(): string {
  // Generate a 13-digit EAN barcode
  const countryCode = '123'; // Example country code
  const manufacturerCode = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  const productCode = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  const baseCode = countryCode + manufacturerCode + productCode;
  const checkDigit = calculateEANCheckDigit(baseCode);
  
  return baseCode + checkDigit;
}

export function calculateEANCheckDigit(code: string): string {
  let sum = 0;
  for (let i = 0; i < code.length; i++) {
    const digit = parseInt(code[i]);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit.toString();
}

export function validateEAN(barcode: string): boolean {
  if (barcode.length !== 13) return false;
  
  const baseCode = barcode.slice(0, 12);
  const checkDigit = barcode.slice(12);
  
  return calculateEANCheckDigit(baseCode) === checkDigit;
}

export function validateUPC(barcode: string): boolean {
  if (barcode.length !== 12) return false;
  
  let sum = 0;
  for (let i = 0; i < 11; i++) {
    const digit = parseInt(barcode[i]);
    sum += i % 2 === 0 ? digit * 3 : digit;
  }
  
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit.toString() === barcode[11];
}

export function formatBarcode(barcode: string): string {
  if (barcode.length === 13) {
    // EAN-13 format: 123 4567 890123
    return `${barcode.slice(0, 3)} ${barcode.slice(3, 7)} ${barcode.slice(7, 13)}`;
  } else if (barcode.length === 12) {
    // UPC-A format: 123456 789012
    return `${barcode.slice(0, 6)} ${barcode.slice(6, 12)}`;
  }
  return barcode;
}
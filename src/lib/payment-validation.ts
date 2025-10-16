/**
 * Payment Method Validation Utilities
 * Prevents test cards and validates payment methods before submission
 */

export interface PaymentMethodInfo {
    brand: string;
    last4: string;
    exp_month: number;
    exp_year: number;
    funding: string;
}

export function validatePaymentMethod(cardNumber: string): {
    isValid: boolean;
    isTestCard: boolean;
    error?: string;
} {
    // Remove spaces and non-digits
    const cleanNumber = cardNumber.replace(/\D/g, '');
    
    // Check for test cards
    const testCardPatterns = [
        '4242424242424242', // Visa test
        '4000000000000002', // Visa declined
        '4000000000009995', // Visa insufficient funds
        '5555555555554444', // Mastercard test
        '2223003122003222', // Mastercard test
        '378282246310005',  // Amex test
        '6011111111111117', // Discover test
    ];
    
    if (testCardPatterns.includes(cleanNumber)) {
        return {
            isValid: false,
            isTestCard: true,
            error: 'Test cards cannot be used in production. Please use a real payment method.'
        };
    }
    
    // Basic Luhn algorithm validation
    if (!isValidLuhn(cleanNumber)) {
        return {
            isValid: false,
            isTestCard: false,
            error: 'Invalid card number. Please check your card details.'
        };
    }
    
    return {
        isValid: true,
        isTestCard: false
    };
}

function isValidLuhn(cardNumber: string): boolean {
    let sum = 0;
    let isEven = false;
    
    // Process digits from right to left
    for (let i = cardNumber.length - 1; i >= 0; i--) {
        let digit = parseInt(cardNumber[i]);
        
        if (isEven) {
            digit *= 2;
            if (digit > 9) {
                digit -= 9;
            }
        }
        
        sum += digit;
        isEven = !isEven;
    }
    
    return sum % 10 === 0;
}

export function getCardBrand(cardNumber: string): string {
    const cleanNumber = cardNumber.replace(/\D/g, '');
    
    if (cleanNumber.startsWith('4')) return 'visa';
    if (cleanNumber.startsWith('5') || cleanNumber.startsWith('2')) return 'mastercard';
    if (cleanNumber.startsWith('3')) return 'amex';
    if (cleanNumber.startsWith('6')) return 'discover';
    
    return 'unknown';
}

export function formatCardNumber(cardNumber: string): string {
    const cleanNumber = cardNumber.replace(/\D/g, '');
    const brand = getCardBrand(cleanNumber);
    
    if (brand === 'amex') {
        // Amex: 4-6-5 format
        return cleanNumber.replace(/(\d{4})(\d{6})(\d{5})/, '$1 $2 $3');
    } else {
        // Visa/MC/Discover: 4-4-4-4 format
        return cleanNumber.replace(/(\d{4})(\d{4})(\d{4})(\d{4})/, '$1 $2 $3 $4');
    }
}

export function validateExpiryDate(month: number, year: number): {
    isValid: boolean;
    error?: string;
} {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;
    
    if (year < currentYear || (year === currentYear && month < currentMonth)) {
        return {
            isValid: false,
            error: 'This card has expired. Please use a valid payment method.'
        };
    }
    
    if (month < 1 || month > 12) {
        return {
            isValid: false,
            error: 'Invalid expiry month. Please enter a valid month (1-12).'
        };
    }
    
    return {
        isValid: true
    };
}

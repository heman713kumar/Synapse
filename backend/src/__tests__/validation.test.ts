/**
 * Validator Tests
 * Tests for email, username, password, and payload validation functions
 */

describe('Email Validation', () => {
    const validateEmail = (email: string) => {
        const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return EMAIL_REGEX.test(email);
    };

    test('should accept valid email addresses', () => {
        expect(validateEmail('user@example.com')).toBe(true);
        expect(validateEmail('john.doe@company.co.uk')).toBe(true);
        expect(validateEmail('test+tag@domain.org')).toBe(true);
    });

    test('should reject invalid email addresses', () => {
        expect(validateEmail('invalid-email')).toBe(false);
        expect(validateEmail('user@')).toBe(false);
        expect(validateEmail('@domain.com')).toBe(false);
        expect(validateEmail('user @domain.com')).toBe(false);
    });

    test('should reject empty email', () => {
        expect(validateEmail('')).toBe(false);
    });
});

describe('Username Validation', () => {
    const validateUsername = (username: string) => {
        const USERNAME_REGEX = /^[a-zA-Z0-9_-]{3,20}$/;
        return USERNAME_REGEX.test(username);
    };

    test('should accept valid usernames', () => {
        expect(validateUsername('john_doe')).toBe(true);
        expect(validateUsername('User123')).toBe(true);
        expect(validateUsername('test-user')).toBe(true);
    });

    test('should reject usernames with special characters', () => {
        expect(validateUsername('john@doe')).toBe(false);
        expect(validateUsername('user!name')).toBe(false);
    });

    test('should enforce length requirement (3-20 chars)', () => {
        expect(validateUsername('ab')).toBe(false); // Too short
        expect(validateUsername('a'.repeat(21))).toBe(false); // Too long
        expect(validateUsername('abc')).toBe(true); // Minimum
        expect(validateUsername('a'.repeat(20))).toBe(true); // Maximum
    });
});

describe('Password Validation', () => {
    const validatePassword = (password: string) => {
        if (!password || password.length < 12 || password.length > 128) {
            return false;
        }

        const hasUppercase = /[A-Z]/.test(password);
        const hasLowercase = /[a-z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

        const typeCount = [hasUppercase, hasLowercase, hasNumbers, hasSpecial].filter(
            Boolean
        ).length;
        return typeCount >= 3;
    };

    test('should accept strong passwords', () => {
        expect(validatePassword('MyP@ssw0rd!')).toBe(true);
        expect(validatePassword('SecurePass123!')).toBe(true);
    });

    test('should require minimum 12 characters', () => {
        expect(validatePassword('Short1!')).toBe(false);
        expect(validatePassword('LongEnough123')).toBe(true);
    });

    test('should require character mix', () => {
        expect(validatePassword('onlylowercase123')).toBe(false); // No uppercase or special
        expect(validatePassword('ONLYUPPERCASE123')).toBe(false); // No lowercase or special
        expect(validatePassword('NoSpecialChar123')).toBe(false); // Missing special char
        expect(validatePassword('NoNumbers!ABC')).toBe(false); // Missing numbers
    });

    test('should reject empty password', () => {
        expect(validatePassword('')).toBe(false);
    });
});

describe('Pagination Validation', () => {
    const validatePagination = (page: any, limit: any) => {
        const pageNum = Math.max(1, parseInt(page) || 1);
        const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
        return { skip: (pageNum - 1) * limitNum, take: limitNum };
    };

    test('should use defaults when values not provided', () => {
        const result = validatePagination(undefined, undefined);
        expect(result).toEqual({ skip: 0, take: 10 });
    });

    test('should enforce minimum page of 1', () => {
        const result = validatePagination(0, 10);
        expect(result.skip).toBe(0); // (1-1) * 10
    });

    test('should enforce maximum limit of 100', () => {
        const result = validatePagination(1, 200);
        expect(result.take).toBe(100);
    });

    test('should calculate correct skip value', () => {
        const result = validatePagination(3, 20);
        expect(result.skip).toBe(40); // (3-1) * 20
        expect(result.take).toBe(20);
    });
});

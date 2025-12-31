import { expect } from 'chai';
import { parseTimeWindow } from '../src/modules/scan/scan.service';

describe('parseTimeWindow', () => {
    const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
    const MILLISECONDS_PER_MONTH = 30 * 24 * 60 * 60 * 1000;
    const MILLISECONDS_PER_YEAR = 365 * 24 * 60 * 60 * 1000;
    const TOLERANCE = 100; // Allow 100ms tolerance for test execution time

    describe('valid time windows', () => {
        it('should parse days correctly', () => {
            const now = Date.now();
            const result = parseTimeWindow('1day');
            const expected = now - MILLISECONDS_PER_DAY;

            expect(result).to.be.closeTo(expected, TOLERANCE);
        });

        it('should parse multiple days correctly', () => {
            const now = Date.now();
            const result = parseTimeWindow('30days');
            const expected = now - (30 * MILLISECONDS_PER_DAY);

            expect(result).to.be.closeTo(expected, TOLERANCE);
        });

        it('should parse months correctly', () => {
            const now = Date.now();
            const result = parseTimeWindow('1month');
            const expected = now - MILLISECONDS_PER_MONTH;

            expect(result).to.be.closeTo(expected, TOLERANCE);
        });

        it('should parse multiple months correctly', () => {
            const now = Date.now();
            const result = parseTimeWindow('6months');
            const expected = now - (6 * MILLISECONDS_PER_MONTH);

            expect(result).to.be.closeTo(expected, TOLERANCE);
        });

        it('should parse years correctly', () => {
            const now = Date.now();
            const result = parseTimeWindow('1year');
            const expected = now - MILLISECONDS_PER_YEAR;

            expect(result).to.be.closeTo(expected, TOLERANCE);
        });

        it('should parse multiple years correctly', () => {
            const now = Date.now();
            const result = parseTimeWindow('2years');
            const expected = now - (2 * MILLISECONDS_PER_YEAR);

            expect(result).to.be.closeTo(expected, TOLERANCE);
        });
    });

    describe('singular and plural forms', () => {
        it('should accept singular day', () => {
            const now = Date.now();
            const result = parseTimeWindow('1day');
            const expected = now - MILLISECONDS_PER_DAY;

            expect(result).to.be.closeTo(expected, TOLERANCE);
        });

        it('should accept plural days', () => {
            const now = Date.now();
            const result = parseTimeWindow('7days');
            const expected = now - (7 * MILLISECONDS_PER_DAY);

            expect(result).to.be.closeTo(expected, TOLERANCE);
        });

        it('should accept singular month', () => {
            const now = Date.now();
            const result = parseTimeWindow('1month');
            const expected = now - MILLISECONDS_PER_MONTH;

            expect(result).to.be.closeTo(expected, TOLERANCE);
        });

        it('should accept plural months', () => {
            const now = Date.now();
            const result = parseTimeWindow('3months');
            const expected = now - (3 * MILLISECONDS_PER_MONTH);

            expect(result).to.be.closeTo(expected, TOLERANCE);
        });

        it('should accept singular year', () => {
            const now = Date.now();
            const result = parseTimeWindow('1year');
            const expected = now - MILLISECONDS_PER_YEAR;

            expect(result).to.be.closeTo(expected, TOLERANCE);
        });

        it('should accept plural years', () => {
            const now = Date.now();
            const result = parseTimeWindow('5years');
            const expected = now - (5 * MILLISECONDS_PER_YEAR);

            expect(result).to.be.closeTo(expected, TOLERANCE);
        });
    });

    describe('case insensitivity', () => {
        it('should accept uppercase DAY', () => {
            const now = Date.now();
            const result = parseTimeWindow('1DAY');
            const expected = now - MILLISECONDS_PER_DAY;

            expect(result).to.be.closeTo(expected, TOLERANCE);
        });

        it('should accept mixed case Month', () => {
            const now = Date.now();
            const result = parseTimeWindow('6MoNtHs');
            const expected = now - (6 * MILLISECONDS_PER_MONTH);

            expect(result).to.be.closeTo(expected, TOLERANCE);
        });

        it('should accept uppercase YEAR', () => {
            const now = Date.now();
            const result = parseTimeWindow('1YEAR');
            const expected = now - MILLISECONDS_PER_YEAR;

            expect(result).to.be.closeTo(expected, TOLERANCE);
        });
    });

    describe('invalid formats', () => {
        const DEFAULT_WINDOW = 6 * MILLISECONDS_PER_MONTH;

        it('should return default for empty string', () => {
            const now = Date.now();
            const result = parseTimeWindow('');
            const expected = now - DEFAULT_WINDOW;

            expect(result).to.be.closeTo(expected, TOLERANCE);
        });

        it('should return default for invalid format', () => {
            const now = Date.now();
            const result = parseTimeWindow('invalid');
            const expected = now - DEFAULT_WINDOW;

            expect(result).to.be.closeTo(expected, TOLERANCE);
        });

        it('should return default for missing number', () => {
            const now = Date.now();
            const result = parseTimeWindow('months');
            const expected = now - DEFAULT_WINDOW;

            expect(result).to.be.closeTo(expected, TOLERANCE);
        });

        it('should return default for missing unit', () => {
            const now = Date.now();
            const result = parseTimeWindow('6');
            const expected = now - DEFAULT_WINDOW;

            expect(result).to.be.closeTo(expected, TOLERANCE);
        });

        it('should return default for invalid unit', () => {
            const now = Date.now();
            const result = parseTimeWindow('6weeks');
            const expected = now - DEFAULT_WINDOW;

            expect(result).to.be.closeTo(expected, TOLERANCE);
        });

        it('should return default for special characters', () => {
            const now = Date.now();
            const result = parseTimeWindow('6-months');
            const expected = now - DEFAULT_WINDOW;

            expect(result).to.be.closeTo(expected, TOLERANCE);
        });
    });

    describe('edge cases', () => {
        it('should handle 0 days', () => {
            const now = Date.now();
            const result = parseTimeWindow('0days');

            expect(result).to.be.closeTo(now, TOLERANCE);
        });

        it('should handle large numbers', () => {
            const now = Date.now();
            const result = parseTimeWindow('100years');
            const expected = now - (100 * MILLISECONDS_PER_YEAR);

            expect(result).to.be.closeTo(expected, TOLERANCE);
        });
    });

    describe('return value type', () => {
        it('should return a number', () => {
            const result = parseTimeWindow('6months');
            expect(result).to.be.a('number');
        });

        it('should return a timestamp in milliseconds', () => {
            const result = parseTimeWindow('6months');
            expect(result).to.be.greaterThan(0);
            expect(result).to.be.lessThan(Date.now());
        });
    });
});

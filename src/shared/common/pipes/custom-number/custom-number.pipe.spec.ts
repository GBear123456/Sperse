import { CustomNumberPipe } from './custom-number.pipe';

describe('PhoneFormatPipe', () => {
    it('custom number parsing', () => {
        const pipe = new CustomNumberPipe('en');
        expect(pipe).toBeTruthy();
        expect(pipe.transform(1568.48, '1.0-0')).toBe('1568');
        expect(pipe.transform(1568.48, '0.2-2')).toBe('48');
        expect(pipe.transform(1568.4, '0.1-2')).toBe('4');
        expect(pipe.transform(1568.4, '0.2-2')).toBe('40');
        expect(pipe.transform(1568.433, '0.2-5')).toBe('433');
        expect(pipe.transform(1568.433457457, '0.3-5')).toBe('43345');
        expect(pipe.transform(1568.433457457, '0.3-10')).toBe('433457457');
        expect(pipe.transform(252036.04, '0.2-2')).toBe('04');
        expect(pipe.transform(252036.04, '1.0-0')).toBe('252036');
        expect(pipe.transform(2.718281828459045)).toBe('2.718');
        expect(pipe.transform(2.718281828459045, '3.1-5')).toBe('002.71828');
        expect(pipe.transform(2.718281828459045, '4.5-5')).toBe('0,002.71828');
        expect(pipe.transform(63.949999999999996, '1.0-0')).toBe('63');
        expect(pipe.transform(63.949999999999996, '0.2-2')).toBe('94');
    });
});

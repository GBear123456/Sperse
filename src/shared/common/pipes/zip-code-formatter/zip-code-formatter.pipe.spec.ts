import { ZipCodeFormatterPipe } from './zip-code-formatter.pipe';

describe('ZipCodeFormatterPipe', () => {
    it('create an instance', () => {
        const pipe = new ZipCodeFormatterPipe();
        expect(pipe).toBeTruthy();
        expect(pipe.transform('123')).toBe('00123');
        expect(pipe.transform('12334')).toBe('12334');
        expect(pipe.transform('12334-3445')).toBe('12334-3445');
        expect(pipe.transform('00334-3445')).toBe('00334-3445');
        expect(pipe.transform('334-45')).toBe('00334-0045');
        expect(pipe.transform('3344563')).toBe('33445-0063');
        expect(pipe.transform('3344563546')).toBe('33445-6354');
    });
});

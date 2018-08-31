import { NumberToWordsPipe } from './number-to-words.pipe';

describe('NumberToWordsPipe', () => {
    it('check number to words options', () => {
        const pipe = new NumberToWordsPipe();
        expect(pipe).toBeTruthy();
        expect(pipe.transform(99, true)).toBe('ninety-nine');
        expect(pipe.transform(99)).toBe('ninety nine');
        expect(pipe.transform(42)).toBe('forty two');
        expect(pipe.transform(11)).toBe('eleven');
    });
});

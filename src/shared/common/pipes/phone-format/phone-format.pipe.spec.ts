import { PhoneFormatPipe } from './phone-format.pipe';

describe('PhoneFormatPipe', () => {
    it('phone parse', () => {
        const pipe = new PhoneFormatPipe();
        expect(pipe).toBeTruthy();
        expect(pipe.transform('+1(601)2832454')).toBe('+1 (601) 283-2454');
        expect(pipe.transform('+1 601) 9188100')).toBe('+1 (601) 918-8100');
        expect(pipe.transform('+380322679502')).toBe('+380 322 679 502');
        expect(pipe.transform('1234567897')).toBe('+1 (123) 456-7897');
        expect(pipe.transform('12345678973')).toBe('+1 (234) 567-8973');
        expect(pipe.transform('+443456789735')).toBe('+44 345 678 9735');
    });
});

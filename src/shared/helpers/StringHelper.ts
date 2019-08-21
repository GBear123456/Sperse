export class StringHelper {
    static prefixes = [ ';base64,77u/', ';base64,' ];

    static getBase64(data: string): string {
        let prefixIndex = 0, prefix = data && StringHelper.prefixes.find(p => (prefixIndex = data.indexOf(p)) !== -1) || '';
        return data && data.slice(prefixIndex + prefix.length);
    }

    static getSize(originalSize: number, data: string): number {
        return data.indexOf(StringHelper.prefixes[0]) >= 0 ? originalSize - 3 : originalSize;
    }

    static convertToBytes(str) {
        let bytes = [];
        for (let i = 0; i < str.length; i++) {
            let charcode = str.charCodeAt(i);
            if (charcode < 0x80) bytes.push(charcode);
            else if (charcode < 0x800) {
                bytes.push(0xc0 | (charcode >> 6),
                          0x80 | (charcode & 0x3f));
            } else if (charcode < 0xd800 || charcode >= 0xe000) {
                bytes.push(0xe0 | (charcode >> 12),
                          0x80 | ((charcode >> 6) & 0x3f),
                          0x80 | (charcode & 0x3f));
            } else {
                i++;
                charcode = 0x10000 + (((charcode & 0x3ff) << 10)
                          | (str.charCodeAt(i) & 0x3ff));
                bytes.push(0xf0 | (charcode >> 18),
                          0x80 | ((charcode >> 12) & 0x3f),
                          0x80 | ((charcode >> 6) & 0x3f),
                          0x80 | (charcode & 0x3f));
            }
        }
        return bytes;
    }
}

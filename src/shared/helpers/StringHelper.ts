export class StringHelper {
    static prefixes = [ ';base64,77u/', ';base64,' ];
    static getBase64(data: string): string {
        let prefixIndex = 0, prefix = data && StringHelper.prefixes.find(p => (prefixIndex = data.indexOf(p)) !== -1) || '';
        return data && prefix && data.slice(prefixIndex + prefix.length);
    }
    static getSize(originalSize: number, data: string): number {
        return data.indexOf(StringHelper.prefixes[0]) === -1 ? originalSize - 3 : originalSize;
    }
}

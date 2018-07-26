export class StringHelper {
    static getBase64(data: string): string {
        let prefix = ';base64,';
        return data && data.slice(data.indexOf(prefix) + prefix.length);
    }
}

export interface Options {
    filename: string;
    fieldSeparator: string;
    quoteStrings: string;
    decimalseparator: string;
    showLabels: boolean;
    showTitle: boolean;
    title: string;
    useBom: boolean;
    headers: string[];
    noDownload: boolean;
    replaceNulls: boolean;
}

export class CsvConfigConsts {

    public static EOL = "\r\n";
    public static BOM = "\ufeff";

    public static DEFAULT_FIELD_SEPARATOR = ',';
    public static DEFAULT_DECIMAL_SEPARATOR = '.';
    public static DEFAULT_QUOTE = '"';
    public static DEFAULT_SHOW_TITLE = false;
    public static DEFAULT_TITLE = 'My Report';
    public static DEFAULT_FILENAME = 'mycsv.csv';
    public static DEFAULT_SHOW_LABELS = false;
    public static DEFAULT_USE_BOM = true;
    public static DEFAULT_HEADER: any[] = [];
    public static DEFAULT_NO_DOWNLOAD = false;
    public static DEFAULT_REPLACE_NULLS = false;
}

export const ConfigDefaults: Options = {
    filename: CsvConfigConsts.DEFAULT_FILENAME,
    fieldSeparator: CsvConfigConsts.DEFAULT_FIELD_SEPARATOR,
    quoteStrings: CsvConfigConsts.DEFAULT_QUOTE,
    decimalseparator: CsvConfigConsts.DEFAULT_DECIMAL_SEPARATOR,
    showLabels: CsvConfigConsts.DEFAULT_SHOW_LABELS,
    showTitle: CsvConfigConsts.DEFAULT_SHOW_TITLE,
    title: CsvConfigConsts.DEFAULT_TITLE,
    useBom: CsvConfigConsts.DEFAULT_USE_BOM,
    headers: CsvConfigConsts.DEFAULT_HEADER,
    noDownload: CsvConfigConsts.DEFAULT_NO_DOWNLOAD,
    replaceNulls: CsvConfigConsts.DEFAULT_REPLACE_NULLS
};

export class Angular5Csv {

    public fileName: string;
    public labels: Array<String>;
    public data: any[];

    private _options: Options;
    private csv = "";

    constructor(DataJSON: any, filename: string, options?: any) {
        let config = options || {};

        this.data = typeof DataJSON != 'object' ? JSON.parse(DataJSON) : DataJSON;

        this._options = this.objectAssign({}, ConfigDefaults, config);

        if (this._options.filename) {
            this._options.filename = filename;
        }

        this.generateCsv();
    }

    /**
     * Generate and Download Csv
     */
    private generateCsv() {
        if (this._options.useBom) {
            this.csv += CsvConfigConsts.BOM;
        }

        if (this._options.showTitle) {
            this.csv += this._options.title + '\r\n\n';
        }

        this.getHeaders();
        this.getBody();

        if (this.csv == '') {
            console.log("Invalid data");
            return;
        }

        if (this._options.noDownload) {
            return this.csv;
        }

        let blob = new Blob([this.csv], { "type": "text/csv;charset=utf8;" });

        if (navigator.msSaveBlob) {
            let filename = this._options.filename.replace(/ /g, "_") + ".csv";
            navigator.msSaveBlob(blob, filename);
        } else {
            let uri = 'data:attachment/csv;charset=utf-8,' + encodeURI(this.csv);
            let link = document.createElement("a");

            link.href = URL.createObjectURL(blob);

            link.setAttribute('visibility', 'hidden');
            link.download = this._options.filename.replace(/ /g, "_") + ".csv";

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    /**
     * Create Headers
     */
    getHeaders(): void {
        if (this._options.headers.length > 0) {
            const { headers } = this._options;
            let row = headers.reduce((headerRow, header) => {
                return headerRow + header + this._options.fieldSeparator;
            }, '');
            row = row.slice(0, -1);
            this.csv += row + CsvConfigConsts.EOL;
        }
    }

    /**
     * Create Body
     */
    getBody() {
        for (let i = 0; i < this.data.length; i++) {
            let row = "";
            for (const index in this.data[i]) {
                row += this.formatData(this.data[i][index]) + this._options.fieldSeparator;
            }

            row = row.slice(0, -1);
            this.csv += row + CsvConfigConsts.EOL;
        }
    }

    /**
     * Format Data
     * @param {any} data
     */
    formatData(data: any) {
        if (this._options.replaceNulls && data === null)
            return '';

        if (this._options.decimalseparator === 'locale' && Angular5Csv.isFloat(data)) {
            return data.toLocaleString();
        }

        if (this._options.decimalseparator !== '.' && Angular5Csv.isFloat(data)) {
            return data.toString().replace('.', this._options.decimalseparator);
        }

        if (typeof data === 'string') {
            data = data.replace(/"/g, '""');
            if (this._options.quoteStrings || data.indexOf(',') > -1 || data.indexOf('\n') > -1 || data.indexOf('\r') > -1) {
                data = this._options.quoteStrings + data + this._options.quoteStrings;
            }
            return data;
        }

        if (typeof data === 'boolean') {
            return data ? 'TRUE' : 'FALSE';
        }
        return data;
    }

    /**
     * Check if is Float
     * @param {any} input
     */
    static isFloat(input: any) {
        return +input === input && (!isFinite(input) || Boolean(input % 1));
    }

    /**
    * Assign data  to new Object
    * @param {any}   target
    * @param {any[]} ...source
    */
    objectAssign(target: any, ...source: any[]) {
        let from: any;
        let to = this.toObject(target);
        let symbols: any;

        for (let s = 1; s < arguments.length; s++) {
            from = Object(arguments[s]);

            for (const key in from) {
                if (Object.prototype.hasOwnProperty.call(from, key)) {
                    to[key] = from[key];
                }
            }

            if ((<any>Object).getOwnPropertySymbols) {
                symbols = (<any>Object).getOwnPropertySymbols(from);
                for (let i = 0; i < symbols.length; i++) {
                    if (Object.prototype.propertyIsEnumerable.call(from, symbols[i])) {
                        to[symbols[i]] = from[symbols[i]];
                    }
                }
            }
        }
        return to;
    }

    /**
    * Convet to Object
    * @param {any} val
    */
    toObject(val: any) {
        if (val === null || val === undefined) {
            throw new TypeError('Object.assign cannot be called with null or undefined');
        }
        return Object(val);
    }
}

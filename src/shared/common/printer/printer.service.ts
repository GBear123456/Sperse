import { Injectable } from '@angular/core';
import { Printer } from './printer.interface';
import { PdfPrinter } from './pdf-printer';
import { PngPrinter } from './png-printer';
import { JpgPrinter } from './jpg-printer';
import { StringPrinter } from './string-printer';

@Injectable()
export class PrinterService {

    private createPrintObject(format: 'pdf' | 'png' | 'string'): Printer {
        let printObject;
        switch (format) {
            case 'pdf': printObject = new PdfPrinter(); break;
            case 'png': printObject = new PngPrinter(); break;
            case 'jpg': printObject = new JpgPrinter(); break;
            default: printObject = new StringPrinter();
        }
        return printObject;
    }

    printDocument(printContent: string, format: 'pdf' | 'png' | 'string' = 'string') {
        const printer = this.createPrintObject(format);
        printer.print(printContent);
    }

}

import { Injectable } from '@angular/core';
import { Printer } from './printer.interface';
import { PdfPrinter } from './pdf-printer';
import { PngPrinter } from './png-printer';
import { JpgPrinter } from './jpg-printer';
import { HtmlPrinter } from './html-printer';
import { StringPrinter } from './string-printer';
import { FileFormat } from './file-format.enum';

@Injectable()
export class PrinterService {

    private createPrintObject(format: FileFormat): Printer {
        let printObject;
        switch (format) {
            case FileFormat.PDF: printObject = new PdfPrinter(); break;
            case FileFormat.PNG: printObject = new PngPrinter(); break;
            case FileFormat.JPG: printObject = new JpgPrinter(); break;
            case FileFormat.Html: printObject = new HtmlPrinter(); break;
            default: printObject = new StringPrinter();
        }
        return printObject;
    }

    printDocument(printContent: any, format: FileFormat = FileFormat.String, printWindowTitle = null) {
        const printer = this.createPrintObject(format);
        printer.print(printContent, printWindowTitle);
    }

}

import { Printer } from './printer.interface';

export class PdfPrinter implements Printer {
    print(base64String: string, title = null) {
        const htmlPop = `<embed width=100% height=100% type="application/pdf"  src="data:application/pdf;base64,${escape(base64String)}"></embed>`;
        const printWindow = window.open ('', 'PDF');
        if (title) {
            printWindow.document.title = title;
        }
        printWindow.document.write(htmlPop);
        printWindow.onload = () => {
            printWindow.print();
        };
    }
}

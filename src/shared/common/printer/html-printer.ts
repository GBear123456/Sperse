import { Printer } from './printer.interface';

export class HtmlPrinter implements Printer {
    print(html) {
        const handle = window.open();
        handle.document.body.innerHTML = html;
        handle.onload = () => {
            handle.print();
            handle.close();
        };
    }
}

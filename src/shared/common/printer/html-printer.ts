import { Printer } from './printer.interface';

export class HtmlPrinter implements Printer {
    print(html, title = null) {
        const handle = window.open();
        if (title) {
            handle.document.title = title;
        }
        handle.document.body.innerHTML = html;
        handle.onload = () => {
            handle.print();
            handle.close();
        };
    }
}

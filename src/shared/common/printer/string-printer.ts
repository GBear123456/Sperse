import { Printer } from './printer.interface';

export class StringPrinter implements Printer {
    print(src: string, title = null) {
        const handle = window.open();
        handle.document.open();
        handle.document.write(src);
        if (title) {
            handle.document.title = title;
        }
        handle.onload = () => {
            handle.print();
            handle.close();
        };
    }
}

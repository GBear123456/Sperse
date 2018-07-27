import { Printer } from './printer.interface';

export class StringPrinter implements Printer {
    print(src: string) {
        const handle = window.open();
        handle.document.open();
        handle.document.write(src);
        handle.onload = () => {
            handle.print();
            handle.close();
        };
    }
}

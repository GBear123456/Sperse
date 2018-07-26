import { Printer } from './printer.interface';

export class PngPrinter implements Printer {
    print(base64String: string) {
        const div = document.createElement('div');
        const image = document.createElement('img');
        image.src = 'data:image/png;base64, ' + base64String;
        div.appendChild(image);
        const handle = window.open();
        handle.document.open();
        handle.document.write(div.innerHTML);
        handle.document.close();
        handle.print();
        handle.close();
    }
}

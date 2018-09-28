import { Printer } from './printer.interface';

export class JpgPrinter implements Printer {
    print(base64String: string, title = null) {
        const div = document.createElement('div');
        const image = document.createElement('img');
        image.src = 'data:image/jpeg;base64, ' + base64String;
        div.appendChild(image);
        const handle = window.open();
        handle.document.open();
        if (title) {
            handle.document.title = title;
        }
        handle.document.write(div.innerHTML);
        handle.document.close();
        handle.onload = () => {
            handle.print();
            handle.close();
        };
    }
}

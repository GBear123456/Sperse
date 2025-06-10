import { Injectable } from '@angular/core';

@Injectable()
export class DialogService {

    static calculateDialogPosition(event, parent, shiftX = 0, shiftY = 0, dialogHeight?) {
        let top, left;
        if (parent) {
            let rect = parent.getBoundingClientRect();
            top = (rect.top + rect.height / 2 - shiftY);
            left = (rect.left + rect.width / 2 - shiftX);
        } else {
            top = event.clientY - shiftY;
            left = event.clientX - shiftX;
        }

        return {
            top: (top < 0 ? dialogHeight ? window.innerHeight - dialogHeight - 20 : 0 : top) + 'px',
            left: (left < 0 ? 0 : left) + 'px'
        };
    }
}

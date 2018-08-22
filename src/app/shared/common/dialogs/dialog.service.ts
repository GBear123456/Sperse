import { Injectable } from '@angular/core';

@Injectable()
export class DialogService {

    calculateDialogPosition(event, parent, shiftX, shiftY) {
        if (parent) {
            let rect = parent.getBoundingClientRect();
            return {
                top: (rect.top + rect.height / 2 - shiftY) + 'px',
                left: (rect.left + rect.width / 2 - shiftX) + 'px'
            };
        } else {
            return {
                top: event.clientY - shiftY + 'px',
                left: event.clientX - shiftX + 'px'
            };
        }
    }
}

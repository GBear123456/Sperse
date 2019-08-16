import { Injectable } from '@angular/core';
import { AppConsts } from '@shared/AppConsts';

@Injectable({
    providedIn: 'root'
})
export class InputStatusesService {
    masks = AppConsts.masks;

    constructor() {
    }

    setMask(event) {
        const inputName = event.element.attributes.name.value;
        if (event.component.option('value')) {
            event.component.option({
                mask: this.masks[inputName],
                maskRules: {'D': /\d?/},
                isValid: true
            });
        }
    }

    focusInput(event) {
        if (!(event.component._value && event.component._value.trim())) {
            let input = event.event.target;
            event.component.option({
                mask: this.masks[input.name],
                maskRules: { 'D': /\d?/ },
                isValid: true
            });
            setTimeout(function () {
                if (input.createTextRange) {
                    let part = input.createTextRange();
                    part.move('character', 0);
                    part.select();
                } else if (input.setSelectionRange)
                    input.setSelectionRange(0, 0);

                input.focus();
            }, 100);
        }
    }

    blurInput(event) {
        if (!(event.component._value && event.component._value.trim()))
            event.component.option({ mask: '', value: '' });
    }
}

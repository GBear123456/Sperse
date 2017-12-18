import { Injectable } from '@angular/core';

@Injectable()
export class UserPreferencesService {
    checkFlag(value, flag): boolean {
        return (value & flag) != 0;
    }

    checkBoxValueChanged(event, obj, prop, flag) {
        if (event.value) {
            obj[prop] |= flag;
        } else {
            obj[prop] &= ~flag;
        }
    }

    isCellMarked(generalValue, flag) {
        return !!(generalValue & flag);
    }

}

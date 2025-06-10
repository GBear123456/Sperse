import { IPhone } from '@shared/common/create-entity-dialog/models/phone.interface';

export class Phone implements IPhone {
    type: string;
    number: string;
    code: string;
    ext: string;

    constructor(type?: string) {
        if (type) {
            this.type = type;
        }
    }
}
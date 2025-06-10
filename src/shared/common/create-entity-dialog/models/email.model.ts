import { IEmail } from '@shared/common/create-entity-dialog/models/email.interface';

export class Email implements IEmail {
    type: string;
    email: string;

    constructor(type?: string) {
        if (type) {
            this.type = type;
        }
    }
}
import { ILink } from '@shared/common/create-entity-dialog/models/link.interface';

export class Link implements ILink {
    type: string;
    url: string;
    isCompany: boolean;

    constructor(type?: string) {
        if (type) {
            this.type = type;
        }
    }
}
import { IAddress } from '@shared/common/create-entity-dialog/models/address.interface';

export class Address implements IAddress {
    type?: string;
    address: string;
    streetNumber: string;
    streetAddress: string;
    neighborhood: string;
    zip: string;
    city: string;
    countryCode: string;
    country: string;
    state: {
        code: string;
        name: string;
    };
    comment: string;

    constructor(type?: string) {
        if (type) {
            this.type = type;
        }
    }

}
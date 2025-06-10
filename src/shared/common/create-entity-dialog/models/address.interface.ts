export interface IAddress {
    type?: string;
    address: string;
    streetNumber: string;
    streetAddress: string;
    zip: string;
    city: string;
    countryCode: string;
    state: {
        code: string;
        name: string;
    };
    comment: string;
}
import { IPropertyInput } from '@shared/service-proxies/service-proxies';
import { Address } from '@shared/common/create-entity-dialog/models/address.model';

type PropertyType = Omit<IPropertyInput, 'yearBuilt' | 'contactId' | 'address'>;

export interface Property extends PropertyType {
    yearBuilt: Date;
    address: Address;
}


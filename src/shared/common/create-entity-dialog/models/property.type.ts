import { IPropertyInput } from '@shared/service-proxies/service-proxies';
import { Address } from '@shared/common/create-entity-dialog/models/address.model';

type PropertyType = Pick<IPropertyInput, 'propertyId' | 'name' | 'note'>;

export interface Property extends PropertyType {
    address: Address;
}


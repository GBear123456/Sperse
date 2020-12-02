import { IPropertyInput } from '@shared/service-proxies/service-proxies';
import { Address } from '@shared/common/create-entity-dialog/models/address.model';

type PropertyType = Pick<IPropertyInput, 'propertyId' | 'name' | 'area' | 'floor' | 'numberOfLevels'>;

export interface Property extends PropertyType {
    yearBuilt: Date;
    address: Address;
}


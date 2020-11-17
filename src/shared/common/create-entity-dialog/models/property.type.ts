import { ICreateAcquisitionLeadInput } from '@shared/service-proxies/service-proxies';
import { Address } from '@shared/common/create-entity-dialog/models/address.model';

type CreateAcquisitionLeadInput = Omit<ICreateAcquisitionLeadInput, 'yearBuilt' | 'contactId' | 'address'>;

export interface Property extends CreateAcquisitionLeadInput {
    yearBuilt: Date;
    address: Address;
}


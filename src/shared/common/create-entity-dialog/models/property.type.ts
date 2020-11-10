import { ICreateAcquisitionLeadInput } from '@shared/service-proxies/service-proxies';
import { IAddress } from '@shared/common/create-entity-dialog/models/address.interface';

type CreateAcquisitionLeadInput = Omit<ICreateAcquisitionLeadInput, 'yearBuilt' | 'contactId' | 'address'>;

export interface Property extends CreateAcquisitionLeadInput {
    yearBuilt: Date;
    address: IAddress;
}


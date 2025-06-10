import { IContactAddressDto } from '@shared/service-proxies/service-proxies';

export interface IAddressDto extends IContactAddressDto {
    inplaceEdit: boolean;
    autoComplete: string;
}
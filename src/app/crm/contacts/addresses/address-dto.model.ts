import { ContactAddressDto } from '@shared/service-proxies/service-proxies';
import { IAddressDto } from '@app/crm/contacts/addresses/address-dto.interface';

export class AddressDto extends ContactAddressDto implements IAddressDto {
    inplaceEdit: boolean;
    autoComplete: string;

    static fromJS(data: any): AddressDto {
        return super.fromJS(data) as AddressDto;
    }
}
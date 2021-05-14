import { ContactAddressDto, IContactAddressDto } from '@shared/service-proxies/service-proxies';
import { IAddressDto } from '@app/crm/contacts/addresses/address-dto.interface';

export class AddressDto extends ContactAddressDto implements IAddressDto {
    inplaceEdit: boolean;
    autoComplete: string;

    constructor(data?: IContactAddressDto) {
        if (data) {
            super(data);
        }
    }

    static fromJS(data: IAddressDto): AddressDto {
        let address: AddressDto = super.fromJS(data) as AddressDto;
        if (data) {
            address.inplaceEdit = data.inplaceEdit;
            address.autoComplete = data.autoComplete;
        }
        return super.fromJS(data) as AddressDto;
    }
}
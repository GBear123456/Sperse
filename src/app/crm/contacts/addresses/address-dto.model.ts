import { ContactAddressDto, IContactAddressDto } from '@shared/service-proxies/service-proxies';
import { IAddressDto } from '@app/crm/contacts/addresses/address-dto.interface';

export class AddressDto extends ContactAddressDto implements IAddressDto {
    inplaceEdit: boolean;
    autoComplete: string;
    countryCode: string;

    constructor(data?: IContactAddressDto, countryCode?: string) {
        if (data) {
            super(data);
        }
        if (countryCode) {
            this.countryCode = countryCode;
        }
    }

    static fromJS(data: IAddressDto): AddressDto {
        let address: AddressDto = super.fromJS(data) as AddressDto;
        if (data) {
            address.inplaceEdit = data.inplaceEdit;
            address.autoComplete = data.autoComplete;
            address.countryCode = data.countryCode;
        }
        return super.fromJS(data) as AddressDto;
    }
}
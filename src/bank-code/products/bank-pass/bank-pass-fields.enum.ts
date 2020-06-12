import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { ContactDto } from '@root/bank-code/products/bank-pass/contact-dto.type';

export const BankPassFields: KeysEnum<ContactDto> = {
    PhotoPublicId: 'PhotoPublicId',
    Id: 'Id',
    Name: 'Name',
    BankCode: 'BankCode',
    BankCodeDate: 'BankCodeDate',
    Email: 'Email',
    Phone: 'Phone',
    CountryId: 'CountryId',
    ContactDate: 'ContactDate',
    State: 'State'
}
import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { BankPassContactDto } from '@root/bank-code/products/bank-pass/contact-dto.type';

export const BankPassFields: KeysEnum<BankPassContactDto> = {
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
};
import { ContactDto } from '@app/crm/clients/contact.dto';

interface ExtendedContactDto extends ContactDto {
    BankCodeDate: string;
    CountryId: number;
}

export type BankPassContactDto = Pick<ExtendedContactDto,
    'PhotoPublicId'
    | 'Id'
    | 'Name'
    | 'BankCode'
    | 'BankCodeDate'
    | 'Email'
    | 'Phone'
    | 'CountryId'
    | 'ContactDate'
    | 'State'
>
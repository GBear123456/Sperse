import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { BusinessEntityDto } from '@app/cfo/business-entities/business-entity-dto.interface';

export const BusinessEntityFields: KeysEnum<BusinessEntityDto> = {
    Id: 'Id',
    Name: 'Name',
    BankAccountIds: 'BankAccountIds',
    ParentName: 'ParentName',
    State: 'State',
    StateId: 'StateId',
    CountryId: 'CountryId',
    DateOpened: 'DateOpened',
    TaxNumber: 'TaxNumber',
    Phone: 'Phone',
    Type: 'Type',
    Industry: 'Industry',
    Status: 'Status',
    IsDefault: 'IsDefault'
};
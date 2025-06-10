export interface BusinessEntityDto {
    Id: number;
    Name: string;
    BankAccountIds: number[];
    ParentName: string;
    State: string;
    StateId: string;
    CountryId: string;
    DateOpened: string;
    TaxNumber: string;
    Phone: string;
    Type: string;
    Industry: string;
    Status: string;
    IsDefault: boolean;
}
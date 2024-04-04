export interface OrderDto {
    Id: number;
    PhotoPublicId: string;
    Name: string;
    Email: string;
    State: string;
    Phone: string;
    Number: string;
    Stage: string;
    StageId: number;
    ContactId: number;
    LeadId: number;
    Amount: number;
    CurrencyId: string;
    OrderType: string;
    OrderDate: string;
    AffiliateContactAffiliateCodes: string[];
    AffiliateContactId: string;
    AffiliateContactName: string;
    PersonalAffiliateCodes: string[];
    SourceAffiliateCode: string;
    SourceEntryUrl: string;
    DateProcessed: string;
    ContactGroupId: string;
    ContactXrefs: string[];
    SourceOrganizationUnitId: number;
}
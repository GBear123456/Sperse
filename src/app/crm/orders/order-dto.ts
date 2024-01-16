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
    AffiliateContactAffiliateCode: string;
    AffiliateContactId: string;
    AffiliateContactName: string;
    PersonalAffiliateCode: string;
    SourceAffiliateCode: string;
    SourceEntryUrl: string;
    DateProcessed: string;
    ContactGroupId: string;
    ContactXref: string;
    SourceOrganizationUnitId: number;
}
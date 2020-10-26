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
    OrderType: string;
    OrderDate: string;
    PersonalAffiliateCode: string;
    SourceAffiliateCode: string;
    SourceEntryUrl: string;
    DateProcessed: string;
    ContactGroupId: string;
    ContactXref: string;
    ServiceProductId: string;
    SourceOrganizationUnitId: number;
}
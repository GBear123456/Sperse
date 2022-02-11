export interface ContactDto {
    Id: number;
    Name: string;
    CompanyName: string;
    Email: string;
    PhotoPublicId: string;
    Phone: string;
    City: string;
    State: string;
    IsActive: boolean;
    IsProspective: boolean;
    ContactDate: string;
    OrganizationId: number;
    Xref: string;
    AffiliateCode: string;
    AssignedUserName: string;
    BankCode: string;
    UserId: number;
    SourceContactId: number;
    ParentId: number;
    GroupId: string;
    AffiliateContactName: string;
    AffiliateContactEmailAddress: string;
    AffiliateContactAffiliateCode: string;
    AffiliateContactId: number;
    AffiliateRate: number;
    AffiliateRateTier2: number;
}
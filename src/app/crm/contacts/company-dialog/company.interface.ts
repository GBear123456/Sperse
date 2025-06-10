export interface Company {
    id: number;
    fullName: string;
    shortName: string;
    typeId: string;
    sizeId: number;
    annualRevenue: number;
    formedStateId: string;
    formedCountryId: string;
    industry: string;
    businessSicCode: number;
    description: string;
    logo: string;
    formedDate: string;
    ein: string;
    duns: string;
    ticker: string;
    notes: string;
    primaryPhoto: string;
    affiliateCode: string;
    rootOrganizationUnitId: number;
    departmentCode: string;
}
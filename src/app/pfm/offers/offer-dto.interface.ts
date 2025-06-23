export interface OfferDto {
    Id: number,
    CampaignId: number,
    LogoUrl: string,
    Name: string,
    CardNetwork: string,
    Categories: string[],
    Status: string,
    Rank: number,
    OverallRating: string,
    IsPublished: boolean,
    Created: string
}
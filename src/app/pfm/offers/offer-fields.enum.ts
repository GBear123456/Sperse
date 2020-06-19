import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { OfferDto } from '@app/pfm/offers/offer-dto.interface';

export const OfferFields: KeysEnum<OfferDto> = {
    Id: 'Id',
    CampaignId: 'CampaignId',
    LogoUrl: 'LogoUrl',
    Name: 'Name',
    CardNetwork: 'CardNetwork',
    Categories: 'Categories',
    Status: 'Status',
    Rank: 'Rank',
    OverallRating: 'OverallRating',
    IsPublished: 'IsPublished',
    Created: 'Created'
};
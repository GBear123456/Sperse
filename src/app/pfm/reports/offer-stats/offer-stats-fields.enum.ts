import { KeysEnum } from '@shared/common/keys.enum/keys.enum';
import { OfferStatsDto } from '@app/pfm/reports/offer-stats/offer-stats-dto.type';

export const OfferStatsFields: KeysEnum<OfferStatsDto> = {
    CampaignId: 'CampaignId',
    LogoUrl: 'LogoUrl',
    Name: 'Name',
    Categories: 'Categories',
    RequestCount: 'RequestCount'
};
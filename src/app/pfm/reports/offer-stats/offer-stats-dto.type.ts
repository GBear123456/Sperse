import { OfferDto } from '@app/pfm/offers/offer-dto.interface';

interface ExtendedOfferStatsDto extends OfferDto {
    RequestCount: number;
}

export type OfferStatsDto = Pick<ExtendedOfferStatsDto, 'CampaignId' | 'LogoUrl' | 'Name' | 'Categories' | 'RequestCount'>;
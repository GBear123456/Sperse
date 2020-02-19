import { IStageDto } from '@shared/service-proxies/service-proxies';

export interface StageDtoExtended extends IStageDto {
    contactGroupId: string;
}
import { IStageDto } from '@shared/service-proxies/service-proxies';

export interface IStage extends IStageDto {
    entities: any[];
    isLoading: boolean;
    full: boolean;
    stageIndex: number;
    total: number;
    lastStageIndex: number;
}

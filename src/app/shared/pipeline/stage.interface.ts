import { IStageDto } from '@shared/service-proxies/service-proxies';
import { StageWidth } from '@app/shared/pipeline/stage-width.enum';

export interface IStage extends IStageDto {
    entities: any[];
    isLoading: boolean;
    full: boolean;
    stageIndex: number;
    total: number;
    lastStageIndex: number;
    width: StageWidth;
}

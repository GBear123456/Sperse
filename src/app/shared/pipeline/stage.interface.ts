import { IStageDto, PipelineDto } from '@shared/service-proxies/service-proxies';
import { StageWidth } from '@app/shared/pipeline/stage-width.enum';

export interface IStage extends IStageDto {
    pipeline: PipelineDto;
    entities: any[];
    isLoading: boolean;
    full: boolean;
    stageIndex: number;
    total: number;
    lastStageIndex: number;
    width: StageWidth;
}

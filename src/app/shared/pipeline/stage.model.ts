import { StageDto } from '@shared/service-proxies/service-proxies';
import { IStage } from '@app/shared/pipeline/stage.interface';
import { StageWidth } from '@app/shared/pipeline/stage-width.enum';

export class Stage extends StageDto {
    entities: any[];
    isLoading: boolean;
    isFull: boolean;
    stageIndex: number;
    index: number;
    dragAllowed: boolean;
    total: number;
    lastStageIndex: number;
    width: StageWidth;
    constructor(data?: IStage) {
        super(data);
    }
}

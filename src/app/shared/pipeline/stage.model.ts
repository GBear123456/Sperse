import { StageDto } from '@shared/service-proxies/service-proxies';
import { IStage } from '@app/shared/pipeline/stage.interface';

export class Stage extends StageDto {
    entities: any[];
    isLoading: boolean;
    isFull: boolean;
    stageIndex: number;
    total: number;
    lastStageIndex: number;
    constructor(data?: IStage) {
        super(data);
    }
}

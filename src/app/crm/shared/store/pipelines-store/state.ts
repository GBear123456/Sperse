import { createEntityAdapter, EntityAdapter } from '@ngrx/entity';
import { PipelineDto } from '@shared/service-proxies/service-proxies';

export const pipelinesAdapter: EntityAdapter<
    PipelineDto
> = createEntityAdapter<PipelineDto>({});

export interface State {
    pipelines: PipelineDto[];
    isLoading: boolean;
    error: string;
    loaded: boolean;
}

export const initialState: State = {
    pipelines: null,
    isLoading: false,
    error: null,
    loaded: false
};

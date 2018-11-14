import { PipelineDto } from 'shared/service-proxies/service-proxies';

export interface State {
    pipelines: PipelineDto[];
    error: string;
    loading: boolean;
    loadedTime: number;
}

export const initialState: State = {
    pipelines: null,
    error: null,
    loading: false,
    loadedTime: null
};

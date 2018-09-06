import { createFeatureSelector, createSelector } from '@ngrx/store';
import { State } from './state';
import { PipelineDto } from 'shared/service-proxies/service-proxies';

interface Filter {
    id?: number;
    purpose?: string;
}

export const getPipelinesState = createFeatureSelector<State>('pipelines');

export const getPipelines = createSelector(
    getPipelinesState,
    (state: State) => state.pipelines
);

export const getLoaded = createSelector(
    getPipelinesState,
    (state: State) => state.loaded
);

/** @todo change with using memoization (test on orders page where component destroy) */
export const getPipeline = (filter: Filter) => createSelector(
    getPipelines,
    (pipelines: PipelineDto[]) => {
        /** @todo change for using of entity adapter */
        return pipelines && pipelines.length
               ? pipelines.find(pipeline => {
                    return filter.id !== undefined ? pipeline.id === filter.id : (filter.purpose ? pipeline.purpose === filter.purpose : false);
                })
               : null;
    }
);

export const getSortedPipeline = (filter: Filter) => createSelector(
    getPipeline(filter),
    (pipeline) => {
        let result = null;
        if (pipeline) {
            pipeline.stages.sort((a, b) => {
                return a.sortOrder > b.sortOrder ? 1 : -1;
            }).forEach((item) => {
                item['index'] = Math.abs(item.sortOrder);
                item['dragAllowed'] = true;
            });
            result = pipeline;
        }
        return result;
    }
);

export const getPipelineStages = (filter: Filter) => createSelector(
    getPipeline(filter),
    (pipeline: PipelineDto) => pipeline.stages
);

export const getPipelineTreeSource = (filter: Filter) => createSelector(
    getPipeline(filter),
    (pipeline: PipelineDto) => {
        let result = [];
        if (pipeline) {
            result.push({
                id: pipeline.id.toString(),
                parent: 0,
                name: pipeline.name
            });
            pipeline.stages.forEach((stage, j) => {
                result.push({
                    id: pipeline.id + ':' + stage.id,
                    parent: pipeline.name,
                    parentId: pipeline.id,
                    name: stage.name
                });
            });
        }
        return result;
    }
);

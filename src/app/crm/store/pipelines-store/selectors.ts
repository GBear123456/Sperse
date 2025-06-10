import { createFeatureSelector, createSelector } from '@ngrx/store';
import { State } from './state';
import { PipelineDto } from 'shared/service-proxies/service-proxies';
import { StageDto } from '@shared/service-proxies/service-proxies';
import { ContactGroup } from '@shared/AppEnums';
import { StageDtoExtended } from '@app/crm/store/pipelines-store/stage-dto-extended.interface';
import { Stage } from '@app/shared/pipeline/stage.model';
import { EntityTypeSys } from '@app/crm/leads/entity-type-sys.enum';

interface Filter {
    id?: number;
    purpose?: any;
    stageId?: number;
    contactGroupId?: ContactGroup;
}

export const getPipelinesState = createFeatureSelector<State>('pipelines');

export const getPipelines = (filter?: Filter) => createSelector(
    getPipelinesState,
    (state: State) => {
        let pipelines = (filter && state && state.pipelines
            ? state.pipelines.filter(filterCallback.bind(this, filter))
            : (state && state.pipelines)
        );

        return pipelines ? pipelines.map(pipeline => {
            pipeline.stages.forEach(stage => {
                stage['pipeline'] = pipeline;
            });
            return pipeline;
        }) : pipelines;
    }
);

export const getLoadedTime = createSelector(
    getPipelinesState,
    (state: State) => state.loadedTime
);

/** @todo change with using memoization (test on orders page where component destroy) */
export const getPipeline = (filter: Filter) => createSelector(
    getPipelines(filter),
    (pipelines: PipelineDto[]) => {
        /** @todo change for using of entity adapter */
        return pipelines && pipelines.length
               ? pipelines.find(filterCallback.bind(this, filter))
               : null;
    }
);

const filterCallback = (filter: Filter, pipeline: PipelineDto) => {
    return filter.id !== undefined ? pipeline.id === filter.id :
        (filter.purpose ? pipeline.purpose === filter.purpose &&
            (!filter.contactGroupId || pipeline.contactGroupId == filter.contactGroupId) : false);
};

export const getSortedPipeline = (filter: Filter) => createSelector(
    getPipeline(filter),
    (pipeline) => {
        let result = null;
        if (pipeline) {
            pipeline.stages.sort((a, b) => {
                return a.sortOrder > b.sortOrder ? 1 : -1;
            }).forEach((item: Stage) => {
                item.index = Math.abs(item.sortOrder);
                item.dragAllowed = true;
            });
            result = pipeline;
        }
        return result;
    }
);

export const getPipelinesStages = (filter: Filter) => createSelector(
    getPipelines(filter),
    (pipelines: PipelineDto[]) => {
        let stages: StageDtoExtended[] = [];
        if (pipelines && pipelines.length) {
            pipelines.forEach((pipeline: PipelineDto) => {
                stages = [ ...stages, ...pipeline.stages.map((stage: StageDto) => {
                    return {
                        ...stage,
                        contactGroupId: pipeline.contactGroupId
                    };
                }) ];
            });
        }
        return stages;
    }
);

export const getPipelineTreeSource = (filter: Filter) => createSelector(
    getPipeline(filter),
    (pipeline: PipelineDto) => {
        let result = [];
        if (pipeline) {
            pipeline.stages.forEach(stage => {
                result.push({
                    id: pipeline.id + ':' + stage.id,
                    name: stage.name
                });
            });
        }
        return result;
    }
);

export const getStageById = (filter: Filter) => createSelector(
    getPipelinesStages(filter),
    (stages: StageDtoExtended[]) => {
        return stages && stages.find(stage => stage.id === +filter.stageId);
    }
);

export const getPropertiesPipeline = () => createSelector(
    getPipelines(),
    (pipelines: PipelineDto[]) => {
        const acquisitionPipeline = pipelines && pipelines.find((pipeline: PipelineDto) => {
            return pipeline.entityTypeSysId === EntityTypeSys.PropertyAcquisition;
        });
        return acquisitionPipeline;
    }
);
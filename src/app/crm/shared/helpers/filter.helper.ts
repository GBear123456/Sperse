import { PipelineDto } from '@shared/service-proxies/service-proxies';

export class FilterHelpers {

    static ConvertPipelinesToTreeSource(data: PipelineDto[]): any[] {
        let result = [];
        data.forEach((pipeline, i) => {
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
        });

        return result;
    }

    static ParsePipelineIds(data: string[]) {
        let filterData = [];
        if (data) {
            data.forEach((id) => {
                let parts = id.split(':');
                filterData.push(parts.length == 2 ?
                    {
                        PipelineId: +parts[0],
                        StageId: +parts[1]
                    } : { PipelineId: +id });
            });
        }

        return filterData;
    }
}

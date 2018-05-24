import { ODataSearchStrategy } from '@shared/AppEnums';
import { FilterModel } from '@shared/filters/models/filter.model';
import { PipelineDto } from '@shared/service-proxies/service-proxies';

import * as _ from 'underscore';

export class FilterHelpers {
    static nameParts = ['NamePrefix', 'FirstName', 'MiddleName', 'LastName', 'NameSuffix', 'NickName'];
    
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

    static filterByClientName(filter: FilterModel) {
        let data = {};
        let filterData = [];
        let element = filter.items["Name"];
        if (element && element.value) {
            let values = FilterModel.getSearchKeyWords(element.value);
            values.forEach((val) => {
                let valFilterData: any[] = [];
                this.nameParts.forEach(x => {
                    let el = {};
                    el[x] = {};
                    el[x][ODataSearchStrategy.StartsWith] = val;
                    valFilterData.push(el);
                });
                
                let valFilter = {
                    or: valFilterData
                };
                filterData.push(valFilter);
            });

            data = {
                and: filterData
            };
        }
        return data;
    }

    static filterBySetOfValues(filter: FilterModel) {
        let data = {};
        let element = filter.items.element;
        if (element && element.value) {
            let filterData = _.map(element.value, x => {
                let el = {};
                el[filter.field] = x;
                return el;
            });

            data = {
                or: filterData
            };
        }
        return data;
    }
}

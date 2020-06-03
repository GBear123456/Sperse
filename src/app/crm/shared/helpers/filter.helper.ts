import { FilterModel } from '@shared/filters/models/filter.model';
import { PipelineDto } from '@shared/service-proxies/service-proxies';
import { FilterItemModel } from '@shared/filters/models/filter-item.model';

import * as _ from 'underscore';
import { FilterMultilineInputModel } from '@root/shared/filters/multiline-input/filter-multiline-input.model';

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

    static filterByStates(filter: FilterModel) {
        let data = {};
        let filterData = [];
        if (filter.items.countryStates && filter.items.countryStates.value) {
            filter.items.countryStates.value.forEach((val) => {
                let parts = val.split(':');
                filterData.push(parts.length == 2 ? {
                    CountryId: parts[0],
                    StateId: parts[1]
                } : {CountryId: val});
            });

            data = {
                or: filterData
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

    static filterByRating(filter: FilterModel) {
        let data = {};
        data[filter.field] = {};
        _.each(filter.items, (item: FilterItemModel, key) => {
            item && item.value && (data[filter.field][filter.operator[key]] = +item.value);
        });
        return data;
    }

    static filterByCustomerStatus(filter: FilterModel) {
        let filterValues = FilterHelpers.filterBySetOfValues(filter);
        if (!filterValues['or'].length) {
            filterValues['or'] = [
                { statusId: 'A' },
                { statusId: 'I' }
            ];
        }
        return filterValues;
    }

    static filterBySource(filter: FilterModel) {
        let filterValues = { 'and': [] };
        let data = filter.items.element.value;
        data.forEach((dataItem) => {
            if (dataItem.value) {
                filterValues.and.push({ [dataItem.name]: dataItem.value });
            }
        });
        return filterValues;
    }

    static filterByMultiline(filter: FilterModel) {
        let data = [];
        let element = filter.items.element as FilterMultilineInputModel;
        if (element) {
            let valuesArray: string[] = element.valuesArray;
            if (valuesArray && valuesArray.length) {
                let inExpression = '';
                for (var i = 0; i < valuesArray.length; i++) {
                    let value = valuesArray[i];
                    if (element.normalize)
                        value = element.normalize(value);
                    inExpression += `'${value.replace(/'/g, "''")}'`;
                    if (i != valuesArray.length - 1)
                        inExpression += ',';
                }
                data = [`${filter.field} in (${encodeURIComponent(inExpression)})`];
            }
        }

        return data;
    }

    static normalizePhone(phone: string) {
        return phone.replace(/[^\d+]/g, "");
    }

    static filterByGroupId() {
        return { 'GroupId': {'eq': 'C'} };
    }
}

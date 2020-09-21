/** Third party imports */
import * as _ from 'underscore';

/** Application imports */
import { FilterModel } from '@shared/filters/models/filter.model';
import { PipelineDto } from '@shared/service-proxies/service-proxies';
import { FilterItemModel } from '@shared/filters/models/filter-item.model';
import { SubscriptionsStatus } from '@app/crm/orders/subscriptions-status.enum';
import { ContactGroup } from '@shared/AppEnums';

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
            let pipelines = {};
            data.sort().forEach(item => {
                let parts = item.split(':'),
                    id = parts[0];
                if (!pipelines[id])
                    pipelines[id] = [];
                if (parts.length > 1)
                    pipelines[id].push(parts[1]);
            });
            _.mapObject(pipelines, (val, key) => {
                filterData.push('PipelineId eq ' + key + ' and StageId in (' + val.join(',') + ')');
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

    static filterBySubscriptionStatus(filter: FilterModel) {
        let data = {};
        let element = filter.items.element;
        if (element && element.value) {
            let filterData = _.map(element.value, item => {
                let result = {};
                if (item == SubscriptionsStatus.CurrentActive) {
                    if (element.value.indexOf(SubscriptionsStatus.CurrentExpired) >= 0)
                        result[filter.field] = item;
                    else
                        result = {
                            and: {
                                [filter.field]: item,
                                or: [
                                    {EndDate: null},
                                    {EndDate: {ge: new Date()}}
                                ]
                            }
                        };
                } else if (item == SubscriptionsStatus.CurrentExpired) {
                    if (element.value.indexOf(SubscriptionsStatus.CurrentActive) >= 0)
                        result = undefined;
                    else
                        result = {
                            and: {
                                [filter.field]: SubscriptionsStatus.CurrentActive,
                                EndDate: {lt: new Date()}
                            }
                        };
                } else
                    result[filter.field] = item;
                return result;
            }).filter(Boolean);

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
        data.forEach(dataItem => {
            if (dataItem.value)
                filterValues.and.push({ [dataItem.name]: dataItem.operator ?
                    {[dataItem.operator]: dataItem.value} : dataItem.value });
        });
        return filterValues;
    }

    static normalizePhone(phone: string) {
        return phone.replace(/[^\d+]/g, '');
    }

    static filterByClientGroupId() {
        return { 'GroupId': {'eq': ContactGroup.Client} };
    }

    static filterByPartnerGroupId() {
        return { 'GroupId': {'eq': ContactGroup.Partner} };
    }

    static filterByParentId(value = null) {
        return { 'ParentId': {'eq': value} };
    }
}

import { BankDto, StatsFilter } from '@shared/service-proxies/service-proxies';
import { FilterModel } from '@shared/filters/models/filter.model';
import { DateHelper } from '@shared/helpers/DateHelper';
import * as _ from 'underscore';

export class FilterHelpers {
    static ConvertBanksToTreeSource(data: BankDto[]): any[] {
        let result = [];
        data.forEach((bank, i) => {
            result.push({
                id: bank.id.toString(),
                parent: 0,
                name: bank.name
            });

            bank.bankAccounts.forEach((acc, j) => {
                result.push({
                    id: bank.id + ':' + acc.id,
                    parent: bank.name,
                    parentId: bank.id,
                    name: acc.accountNumber + ': ' + (acc.accountName ? acc.accountName : 'No name')
                });
            });
        });

        return result;
    }

    static filterByField(filter: FilterModel, requestFilter: StatsFilter) {
        if (filter.items.element && filter.items.element.value)
            requestFilter[filter.field] = filter.items.element.value;
    }

    static filterByBusinessEntity(filter: FilterModel, requestFilter: StatsFilter) {
        FilterHelpers.filterByField(filter, requestFilter);
    }

    static filterByAccount(filter: FilterModel, requestFilter: StatsFilter) {
        FilterHelpers.filterByField(filter, requestFilter);
    }

    static filterByDate(filter: FilterModel, requestFilter: StatsFilter) {
        requestFilter.startDate = undefined;
        requestFilter.endDate = undefined;
        let keys = Object.keys(filter.items);
        for (let key of keys) {
            let item = filter.items[key];
            if (item && item.value) {
                let date =  new Date(item.value.getTime());
                DateHelper.removeTimezoneOffset(date);

                requestFilter[(key == 'to' ? 'end' : 'start') + 'Date'] = date;
            }
        }
    }

    static filterByExcludeElement(filter: FilterModel) {
        let data = {};
        if (filter.items.element && filter.items.element.value) {
            let filterData = _.map(filter.items.element.value, x => {
                let el = {};
                el[filter.field] = { ne: x };
                return el;
            });

            data = {
                and: filterData
            };
        }

        return data;
    }
}

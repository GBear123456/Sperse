import * as _ from 'lodash';
import { BankDto, StatsFilter } from '@shared/service-proxies/service-proxies';
import { FilterModel } from '@shared/filters/models/filter.model';
import * as moment from 'moment';

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

    static filterByBusinessEntity(filter: FilterModel, requestFilter: StatsFilter) {
        let data = {};
        if (filter.items.element && filter.items.element.value) {
            requestFilter[filter.field] = filter.items.element.value.map(x => x);
        }
    }

    static filterByAccount(filter: FilterModel, requestFilter: StatsFilter) {
        if (filter.items && filter.items.element && filter.items.element.value) {
            requestFilter.accountIds = [];
            requestFilter.bankIds = [];
            filter.items.element.value.forEach((id) => {
                let parts = id.split(':');
                if (parts.length == 2) {
                    requestFilter.accountIds.push(+parts[1]);
                } else {
                    requestFilter.bankIds.push(+parts[0]);
                }
            });
        }
    }

    static filterByDate(filter: FilterModel, requestFilter: StatsFilter) {
        requestFilter.startDate = undefined;
        requestFilter.endDate = undefined;
        let keys = Object.keys(filter.items);
        for (let key of keys) {
            let item = filter.items[key];
            if (item && item.value) {
                let date = moment.utc(item.value, 'YYYY-MM-DDT');
                if (key.toString() === 'to') {
                    date.add(1, 'd').add(-1, 's');
                    requestFilter.endDate = <any>date.toDate();
                } else {
                    requestFilter.startDate = <any>date.toDate();
                }
            }
        }
    }

}

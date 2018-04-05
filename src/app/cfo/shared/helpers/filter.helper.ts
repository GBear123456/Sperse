import { BankDto, StatsFilter } from '@shared/service-proxies/service-proxies';
import { FilterModel } from '@shared/filters/models/filter.model';

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
        if (filter.items && filter.items.element) {
            requestFilter.accountIds = [];
            requestFilter.bankIds = [];
            filter.items.element['dataSource'].forEach((syncAccount, i) => {
                syncAccount.bankAccounts.forEach((bankAccount, i) => {
                    if (bankAccount['selected']) {
                        requestFilter.accountIds.push(+bankAccount.id);
                    }
                });                
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
                let date = new Date(item.value.getTime());
                date.setTime(date.getTime() - (date.getTimezoneOffset() * 60 * 1000));
                requestFilter[(key == 'to' ? 'end': 'start') + 'Date'] = date;
            }
        }
    }

}

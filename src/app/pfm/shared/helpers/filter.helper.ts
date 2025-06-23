import { FilterModel } from '@shared/filters/models/filter.model';

export class FilterHelpers {
    static filterByCategory(filter: FilterModel) {
        let data = {};
        if (filter.items.element && filter.items.element.value) {
            let filterData = [];
            filter.items.element.value.forEach(category => {
                filterData.push({ or: [{ Categories: { any: { CampaignCategory: category } } }] });
            });
            data = {
                or: filterData
            };
        }

        return data;
    }

    static filterByTrafficSource() {
        return {'TrafficSource': {'ne': 'Decline'}};
    }
}

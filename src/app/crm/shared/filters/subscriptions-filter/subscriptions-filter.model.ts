import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel, DisplayElement } from '@shared/filters/models/filter-item.model';
import { SubscriptionAvailability } from '@app/crm/shared/filters/subscriptions-filter/subscription-availability.enum';

export class SubscriptionsFilterModel extends FilterItemModel {
    keyExpr: any;
    parentExpr?: any = 'parentId';
    nameField: string;

    public constructor(init?: Partial<SubscriptionsFilterModel>) {
        super(init, true);
    }

    get value() {
        let result = [];
        this.dataSource && this.dataSource
            .filter(item => item.current || item.past || item.never)
            .forEach((item, index) => {
                result.push(
                    {
                        name: ['subscriptionFilters[' + index + '].TypeId'],
                        value: item.id
                    },
                    {
                        name: ['subscriptionFilters[' + index + '].SubscriptionAvailability'],
                        value: (item.current ? SubscriptionAvailability.Current : 0) |
                               (item.past ? SubscriptionAvailability.Past : 0) |
                               (item.never ? SubscriptionAvailability.Never : 0)
                    }
                );
            });
        return result;
    }

    getObjectValue() {
        let value = {};
        this.value.forEach((item) => {
            value[item.name] = item.value;
        });
        return value;
    }

    getDisplayElements(): DisplayElement[] {
        let result: DisplayElement[] = [];
        if (this.dataSource) {
            this.dataSource.forEach((item) => {
                if (item.current || item.past || item.never) {
                    let subscriptions = [
                        item.current ? 'Current' : null,
                        item.past ? 'Past' : null,
                        item.never ? 'Never' : null
                    ];
                    result.push(<DisplayElement>{
                        item: this,
                        id: item.id,
                        displayValue: item.name + ' (' + (subscriptions.filter(Boolean).join(',')) + ')'
                    });
                }
            });
        }
        return result;
    }

    clearItem(item) {
        item.current = item.past = item.never = null;
    }

    removeFilterItem(filter: FilterModel, args: any, id: string) {
        if (id) {
            let item = filter.items.element.dataSource.find((item) => item.id === id);
            this.clearItem(item);
        } else {
            filter.items.element.dataSource.forEach((item) => {
                this.clearItem(item);
            });
        }
    }
}

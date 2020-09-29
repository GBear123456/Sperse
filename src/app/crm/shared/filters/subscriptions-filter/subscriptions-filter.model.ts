import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel, DisplayElement } from '@shared/filters/models/filter-item.model';
import { SubscriptionAvailability } from '@app/crm/shared/filters/subscriptions-filter/subscription-availability.enum';

export class SubscriptionsFilterModel extends FilterItemModel {
    nameField: string;

    public constructor(init?: Partial<SubscriptionsFilterModel>) {
        super(init, true);
    }

    get value() {
        let result = [], filterIndex = 0;
        this.dataSource && this.dataSource
            .filter(item => item.current || item.past || item.never ||
                item.current == undefined || item.past == undefined ||
                item.never == undefined
            ).forEach(item => {
                if (item.current || item.past || item.never) {
                    result.push(
                        {
                            name: ['subscriptionFilters[' + filterIndex + '].ProductId'],
                            value: item.id
                        },
                        {
                            name: ['subscriptionFilters[' + filterIndex + '].Availability'],
                            value: (item.current ? SubscriptionAvailability.Current : 0) |
                                   (item.past ? SubscriptionAvailability.Past : 0) |
                                   (item.never ? SubscriptionAvailability.Never : 0)
                        }
                    );
                    filterIndex++;
                }

                if (item.current == undefined || item.past == undefined || item.never == undefined) {
                    item.serviceProductLevels.forEach(level => {
                        if (level.current || level.past || level.never) {
                            result.push(
                                {
                                    name: ['subscriptionFilters[' + filterIndex + '].ProductId'],
                                    value: item.id
                                },
                                {
                                    name: ['subscriptionFilters[' + filterIndex + '].LevelId'],
                                    value: level.id
                                },
                                {
                                    name: ['subscriptionFilters[' + filterIndex + '].Availability'],
                                    value: (level.current ? SubscriptionAvailability.Current : 0) |
                                           (level.past ? SubscriptionAvailability.Past : 0) |
                                           (level.never ? SubscriptionAvailability.Never : 0)
                                }
                            );
                            filterIndex++;
                        }
                    });
                }
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
                    result.push(<DisplayElement>{
                        item: this,
                        id: item.id,
                        displayValue: item.name + ' (' + ([
                            item.current ? 'Current' : null,
                            item.past ? 'Past' : null,
                            item.never ? 'Never' : null
                        ].filter(Boolean).join(',')) + ')'
                    });
                }
                if (item.serviceProductLevels && item.serviceProductLevels.length)
                    item.serviceProductLevels.forEach(level => {
                        if (level.current || level.past || level.never) {
                            result.push(<DisplayElement>{
                                item: this,
                                id: level.id,
                                displayValue: level.name + ' (' + ([
                                    level.current ? 'Current' : null,
                                    level.past ? 'Past' : null,
                                    level.never ? 'Never' : null
                                ].filter(Boolean).join(',')) + ')'
                            });
                        }
                    });
            });
        }
        return result;
    }

    clearItem(item) {
        item.current = item.past = item.never = null;
    }

    removeFilterItem(filter: FilterModel, args: any, id: string) {
        if (id !== undefined) {
            let item = filter.items.element.dataSource.find((item) => item.id === id);
            this.clearItem(item);
        } else {
            filter.items.element.dataSource.forEach((item) => {
                this.clearItem(item);
            });
        }
    }
}
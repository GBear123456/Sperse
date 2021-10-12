import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel, DisplayElement } from '@shared/filters/models/filter-item.model';
import { SubscriptionAvailability } from '@app/crm/shared/filters/subscriptions-filter/subscription-availability.enum';

export class SubscriptionsFilterModel extends FilterItemModel {
    filterBy: string;
    filterKey: string;
    nameField: string;    
    itemsExpr: string;
    autoExpandAll = false;
    dataStructure = 'tree';
    keyExpr = 'uid';

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
                            name: ['subscriptionFilters.' + this.filterBy + '[' + filterIndex + '].' + this.filterKey],
                            value: item.id
                        },
                        {
                            name: ['subscriptionFilters.' + this.filterBy + '[' + filterIndex + '].Availability'],
                            value: (item.current ? SubscriptionAvailability.Current : 0) |
                                   (item.past ? SubscriptionAvailability.Past : 0) |
                                   (item.never ? SubscriptionAvailability.Never : 0)
                        }
                    );
                    filterIndex++;
                }

                if (item.memberServiceLevels && (item.current || item.past || item.never || 
                    item.current == undefined || item.past == undefined || item.never == undefined)
                ) {
                    item.memberServiceLevels.forEach(level => {
                        if (level.current || level.past || level.never) {
                            result.push(
                                {
                                    name: ['subscriptionFilters.' + this.filterBy + '[' + filterIndex + '].' + this.filterKey],
                                    value: item.id
                                },
                                {
                                    name: ['subscriptionFilters.' + this.filterBy + '[' + filterIndex + '].LevelId'],
                                    value: level.id
                                },
                                {
                                    name: ['subscriptionFilters.' + this.filterBy + '[' + filterIndex + '].Availability'],
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
                let initialCount = result.length;
                if (item.memberServiceLevels && item.memberServiceLevels.length)
                    item.memberServiceLevels.forEach(level => {
                        if (level.current && !item.current ||
                            level.past && !item.past ||
                            level.never && !item.never
                        ) {
                            result.push(<DisplayElement>{
                                item: this,
                                id: level.id,
                                args: level.uid,
                                parentCode: item.id,
                                displayValue: level.name + ' (' + ([
                                    level.current ? 'Current' : null,
                                    level.past ? 'Past' : null,
                                    level.never ? 'Never' : null
                                ].filter(Boolean).join(',')) + ')'
                            });
                        }
                    });
                if (item.current || item.past || item.never || result.length != initialCount) {
                    let columns = [
                        item.current ? 'Current' : null,
                        item.past ? 'Past' : null,
                        item.never ? 'Never' : null
                    ].filter(Boolean);
                    result.splice(initialCount, 0, <DisplayElement>{
                        item: this,
                        id: item.id,
                        args: item.uid,
                        displayValue: item.name + (columns.length ?
                            ' (' +  columns.join(',') + ')' : ''
                        )
                    });
                }
            });
        }
        return result;
    }

    clearItem(item) {
        item.current = item.past = item.never = null;
        if (item.memberServiceLevels)
            item.memberServiceLevels.forEach(level => {
                level.current = level.past = level.never = null;
            });
    }

    removeFilterItem(filter: FilterModel, uid: any, id: string) {
        if (id !== undefined) {
            this.clearItem(
                filter.items.element.dataSource.reduce((result, item) => {
                    if (result && result.uid === uid)
                        return result;
                    else if (item.uid === uid)
                        return item;
                    else if (item.memberServiceLevels)
                        return item.memberServiceLevels.find(level => level.uid == uid);
                }, null)
            );
        } else {
            filter.items.element.dataSource && filter.items.element.dataSource.forEach((item) => {
                this.clearItem(item);
            });
        }
    }
}
import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel, DisplayElement } from '@shared/filters/models/filter-item.model';
import { SubscriptionAvailability } from '@app/crm/shared/filters/subscriptions-filter/subscription-availability.enum';

export class SubscriptionsFilterModel extends FilterItemModel {
    filterBy: string;
    filterKey: string;
    nameField: string;
    codeField: string;
    itemsExpr: string;
    filterMode: string;
    autoExpandAll = false;
    dataStructure = 'tree';
    keyExpr = 'uid';
    ignoreParent: boolean;

    public constructor(init?: Partial<SubscriptionsFilterModel>) {
        super(init, true);
        this.disableOuterScroll = true;
    }

    get value() {
        let result = [], filterIndex = 0;

        this.dataSource && this.dataSource
            .filter(item => item.current || item.past || item.never ||
                item.current == undefined || item.past == undefined ||
                item.never == undefined
            ).forEach(item => {
                if (item.current || item.past || item.never) {
                    if (!this.ignoreParent || !item[this.itemsExpr]) {
                        result.push(
                            {
                                name: ['subscriptionFilter.' + this.filterBy + '[' + filterIndex + '].' + this.filterKey],
                                value: item.id
                            },
                            {
                                name: ['subscriptionFilter.' + this.filterBy + '[' + filterIndex + '].Availability'],
                                value: (item.current ? SubscriptionAvailability.Current : 0) |
                                    (item.past ? SubscriptionAvailability.Past : 0) |
                                    (item.never ? SubscriptionAvailability.Never : 0)
                            }
                        );
                        filterIndex++;
                    }
                }

                if (item[this.itemsExpr] && (item.current || item.past || item.never ||
                    item.current == undefined || item.past == undefined || item.never == undefined)
                ) {
                    item[this.itemsExpr].forEach(level => {
                        if (level.current || level.past || level.never) {
                            result.push({
                                name: ['subscriptionFilter.' + this.filterBy + '[' + filterIndex + '].' + this.filterKey],
                                value: this.ignoreParent ? level.id : item.id
                            });
                            if (!this.ignoreParent)
                                result.push({
                                    name: ['subscriptionFilter.' + this.filterBy + '[' + filterIndex + '].LevelId'],
                                    value: level.id
                                });
                            result.push({
                                name: ['subscriptionFilter.' + this.filterBy + '[' + filterIndex + '].Availability'],
                                value: (level.current ? SubscriptionAvailability.Current : 0) |
                                    (level.past ? SubscriptionAvailability.Past : 0) |
                                    (level.never ? SubscriptionAvailability.Never : 0)
                            });

                            filterIndex++;
                        }
                    });
                }
            });

        if (this.filterMode)
            result.push({
                name: 'subscriptionFilter.Mode',
                value: this.filterMode
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

    onDataSourceLoaded() {
        this.dataSource.forEach(parent => {
            parent.uid = parent.id;
            if (parent[this.itemsExpr])
                parent[this.itemsExpr].forEach(child => {
                    child.uid = parent.id + ':' + child.id;
                });
        });
    }

    getDisplayElements(): DisplayElement[] {
        let result: DisplayElement[] = [];
        if (this.dataSource) {
            this.dataSource.forEach((item) => {
                let initialCount = result.length;
                if (item[this.itemsExpr] && item[this.itemsExpr].length)
                    item[this.itemsExpr].forEach(level => {
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
                            ' (' + columns.join(',') + ')' : ''
                        )
                    });
                }
            });
        }
        return result;
    }

    removeFilterItem(filter: FilterModel, uid: any, id: string) {
        if (id !== undefined) {
            let itemToRemove = null;
            let parentItem = null;
            (<any[]>this.dataSource).some((item) => {
                if (item.uid === uid) {
                    itemToRemove = item;
                }
                else if (item[this.itemsExpr]) {
                    itemToRemove = item[this.itemsExpr].find(level => level.uid == uid);
                    parentItem = itemToRemove ? item : null;
                }

                return !!itemToRemove;
            })

            this.clearItem(itemToRemove, parentItem);
        } else {
            this.dataSource && this.dataSource.forEach((item) => {
                this.clearItem(item);
            });
        }
    }

    clearItem(item, parentItem = null) {
        item.current = item.past = item.never = null;
        if (item[this.itemsExpr])
            item[this.itemsExpr].forEach(level => {
                level.current = level.past = level.never = null;
            });
        if (parentItem) {
            parentItem.current = this.calculateParentSelected(parentItem, 'current');
            parentItem.past = this.calculateParentSelected(parentItem, 'past');
            parentItem.never = this.calculateParentSelected(parentItem, 'never');
        }
    }

    calculateParentSelected(parentItem, availability): boolean {
        let children = parentItem[this.itemsExpr];
        let selectedCount = children.filter(item => item[availability]).length;
        return selectedCount == children.length ? true :
            selectedCount ? undefined : false;
    }
}
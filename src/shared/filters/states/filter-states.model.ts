/** Core imports */

/** Third party imports */
import sortBy from 'lodash/sortBy';
import remove from 'lodash/remove';
import DevExpress from 'devextreme/bundles/dx.all';
import { Observable, forkJoin, of, zip } from 'rxjs';
import { map } from 'rxjs/operators';

/** Application imports */
import { FilterModel } from '@shared/filters/models/filter.model';
import { FilterItemModel, DisplayElement } from '@shared/filters/models/filter-item.model';
import { FilterStatesService } from './filter-states.service';
import { ICountryState } from './country-state.interface';

export class FilterStatesModel extends FilterItemModel {
    list: DevExpress.ui.dxTreeViewNode[];
    filterStatesService: FilterStatesService;

    constructor(filterStatesService: FilterStatesService, value?: any, isPartial = false) {
        super(value, isPartial);
        this.disableOuterScroll = true;
        this.filterStatesService = filterStatesService;
    }

    getDisplayElements(): any {
        return this.value.length ? forkJoin(this.value.map((selectedCode: string) => {
            const [ countryCode, stateCode ] = selectedCode.split(':');
            let itemData, parentData, list$;
            if (countryCode && !this.list) {
                /** Upload countries and states */
                list$ = zip(
                    this.filterStatesService.getCountries([countryCode], stateCode ? [countryCode] : null),
                    stateCode ? this.filterStatesService.getStates(countryCode, [stateCode]) : of(null)
                ).pipe(
                    map(([countries, states]: [ICountryState[], ICountryState[]]) => {
                        return countries.map((country: ICountryState) => {
                            country['children'] = states;
                            return country;
                        });
                    })
                );
            } else {
                list$ = of(this.list);
            }

            return list$.pipe(
                map((list: any) => {
                    let parentData = itemData = list.find((val: any) => val.key === countryCode || val.code === countryCode);
                    if (itemData && stateCode) {
                        itemData = itemData.children.find((val: any) => val.key === selectedCode || val.code === selectedCode);
                    }
                    if (itemData) {
                        const itemName = itemData.text || itemData.name;
                        let parentName = itemData.parent || itemData.parentId ? parentData.text || parentData.name : null;
                        let sortField = parentName ? parentName + ':' : '';
                        sortField += itemName;
                        return {
                            item: this,
                            displayValue: itemName,
                            args: selectedCode,
                            parentCode: itemData.parent || itemData.parentId ? parentData.key || parentData.code : null,
                            parentName: parentName,
                            sortField: sortField
                        };
                    }
                })
            );
        })).pipe(map((elements: any) =>
            this.generateParents(sortBy(elements, 'sortField'))
        )) : [];
    }

    removeFilterItem(filter: FilterModel, args: any) {
        if (args)
            remove(this.value, (val: any) => val == args);
        else
            this.value = [];
    }

    private generateParents(displayedElements: DisplayElement[]): DisplayElement[] {
        let parents: DisplayElement[] = [];
        displayedElements.forEach((displayedElement: DisplayElement) => {
            if (displayedElement.parentCode) {
                let parent = parents.find(y => y.args == displayedElement.parentCode);
                if (!parent) {
                    parents.push(<DisplayElement>{
                        displayValue: displayedElement.parentName,
                        readonly: true,
                        args: displayedElement.parentCode
                    });
                }
                parents.push(displayedElement);
            } else {
                parents.push(displayedElement);
            }
        });

        return parents;
    }
}

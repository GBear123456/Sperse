/** Core imports */
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';

/** Third party imports */
import { Store } from '@ngrx/store';
import { CacheService } from 'ng2-cache-service';

/** Application imports */
import { CountriesStoreActions, RootStore } from '@root/store';
import { FilterComponent } from '../models/filter-component';
import { FilterStatesModel } from './filter-states.model';
import { FilterStatesService } from './filter-states.service';
import { ICountryState } from './country-state.interface';

@Component({
    templateUrl: './filter-states.component.html',
    styleUrls: ['./filter-states.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class FilterStatesComponent implements FilterComponent, OnInit {
    items: {
        countryStates: FilterStatesModel
    };
    component: any;
    apply: (event) => void;
    selectedCountries: string[] = [];
    countriesToExpand: string[] = [];
    selectedStates: string[] = [];

    constructor(
        private cacheService: CacheService,
        private filterStatesService: FilterStatesService,
        private store$: Store<RootStore.State>
    ) {}

    ngOnInit() {
        if (this.items.countryStates.value && this.items.countryStates.value.length) {
            this.items.countryStates.value.forEach((countryState: string) => {
                const [ countryCode, stateCode ] = countryState.split(':');
                if (stateCode) {
                    this.selectedStates.push(stateCode);
                    this.countriesToExpand.push(countryCode);
                } else {
                    this.selectedCountries.push(countryCode);
                }
            });
        }
        /** Load all countries */
        this.store$.dispatch(new CountriesStoreActions.LoadRequestAction());
    }

    /**
     * Returns items for expanded node, but also returns items for root
     * @param node
     * @return {Promise<ICountryState[]>}
     */
    createChildren = (node) => {
        if (!node) {
            /** Return list of countries */
            return this.filterStatesService.getCountries(this.selectedCountries, this.countriesToExpand).toPromise();
        } else {
            /** Return states of specific country */
            return this.filterStatesService.getStates(node.key, this.selectedStates).toPromise();
        }
    }

    onSelect($event) {
        this.items.countryStates.value = $event.component.getSelectedNodesKeys();
        this.updateValues($event);
    }

    updateValues($event) {
        this.items.countryStates.list = $event.component.getNodes();
    }
}
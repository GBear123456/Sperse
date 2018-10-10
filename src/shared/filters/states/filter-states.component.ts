/** Core imports */
import { Component, Injector, OnDestroy, OnInit } from '@angular/core';

/** Third party imports */
import { Store, select } from '@ngrx/store';
import { AppComponentBase } from '@shared/common/app-component-base';
import { filter } from 'rxjs/operators';
import { CacheService } from 'ng2-cache-service';
import * as _ from 'underscore';

/** Application imports */
import { CountriesStoreActions, CountriesStoreSelectors } from '@app/store';
import { RootStore, StatesStoreActions, StatesStoreSelectors } from '@root/store';
import { FilterComponent } from '../models/filter-component';
import { FilterStatesModel } from './filter-states.model';

@Component({
    templateUrl: './filter-states.component.html',
    styleUrls: ['./filter-states.component.less']
})
export class FilterStatesComponent extends AppComponentBase implements FilterComponent, OnDestroy, OnInit {
    items: {
        countryStates: FilterStatesModel
    };
    component: any;
    apply: (event) => void;
    countryStates: any[];
    preloadIndex: {
        [code: string]: number
    } = {};

    constructor(injector: Injector,
        private _cacheService: CacheService,
        private store$: Store<RootStore.State>
    ) {
        super(injector);
    }

    onExpand($event) {
        if (this.preloadIndex[$event.key]) {
            this.countryStates.splice(
                _.findIndex(this.countryStates, { parent: $event.key }), 1);
            this.preloadIndex[$event.key] = 0;
            this.component.beginCustomLoading();

            this.store$.dispatch(new StatesStoreActions.LoadRequestAction($event.key));
            this.store$.pipe(select(StatesStoreSelectors.getState, { countryCode: $event.key }))
                .pipe(filter(data => !!data))
                .subscribe((data) => {
                    data.forEach((state) => {
                        this.countryStates.push({
                            parent: $event.key,
                            code: $event.key + ':' + state.code,
                            name: state.name
                        });
                    });
                    this.component.endCustomLoading();
                    this.applySelectedRowKeys();
                });
        }
    }

    onSelect($event) {
        this.items.countryStates.value = _.union(_.difference(
            this.items.countryStates.value, $event.currentDeselectedRowKeys),
            $event.currentSelectedRowKeys
        );
    }

    onInitialized($event) {
        this.component = $event.component;
        this.applySelectedRowKeys();
    }

    applySelectedRowKeys() {
        this.component.option(
            'selectedRowKeys', this.items.countryStates.value
        );
    }

    ngOnInit() {
        if (this._cacheService.exists('countryStates_preloadIndex')) {
            this.items.countryStates.list = this.countryStates = this._cacheService.get('countryStates');
            this.preloadIndex = this._cacheService.get('countryStates_preloadIndex');
        } else {
            this.store$.dispatch(new CountriesStoreActions.LoadRequestAction());
            this.store$.pipe(select(CountriesStoreSelectors.getCountries)).subscribe((data) => {
                this.countryStates = data;
                data.forEach((country, index) => {
                    this.preloadIndex[country.code] =
                        this.countryStates.push({
                            code: index + country.code,
                            parent: country.code
                        });
                });
                this.items.countryStates.list = data;
            });
        }
    }

    ngOnDestroy() {
        this._cacheService.set('countryStates', this.countryStates);
        this._cacheService.set('countryStates_preloadIndex', this.preloadIndex);
    }
}

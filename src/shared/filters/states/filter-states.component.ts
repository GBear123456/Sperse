import { Component, Injector } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { CountryServiceProxy } from '@shared/service-proxies/service-proxies';
import { FilterComponent } from '../filter.model';
import { FilterStatesModel } from './filter-states.model'

import * as _ from 'underscore';

@Component({
    templateUrl: './filter-states.component.html',
    styleUrls: ['./filter-states.component.less'],
    providers: [CountryServiceProxy]
})
export class FilterStatesComponent extends AppComponentBase implements FilterComponent {
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
        private _countryService: CountryServiceProxy
    ) {
        super(injector);

        _countryService.getCountries().subscribe((data) => {
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

    onExpand($event) {
        if (this.preloadIndex[$event.key]) {
            this.countryStates.splice(
                _.findIndex(this.countryStates, { parent: $event.key }), 1);
            this.preloadIndex[$event.key] = 0;
            this.component.beginCustomLoading();
            this._countryService.getCountryStates($event.key)
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
                }
                );
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
            "selectedRowKeys", this.items.countryStates.value
        );
    }
}

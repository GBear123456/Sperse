import {Component, Injector, OnInit, Input, EventEmitter, Output} from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FiltersService } from '@shared/filters/filters.service';
import { CustomerRatingsServiceProxy, RateCustomerInput, CustomerRatingInfoDto } from '@shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';

@Component({
  selector: 'crm-rating',
  templateUrl: './rating.component.html',
  styleUrls: ['./rating.component.less'],
  providers: [CustomerRatingsServiceProxy]
})
export class RatingComponent extends AppComponentBase implements OnInit {
    @Input() selectedKeys: any;
    @Input() targetSelector = "[aria-label='Rating']";
    @Input() bulkUpdateMode = false;
    @Input() set selectedItemKey(value) {
        this.ratingValue = value;
    }
    get selectedItemKey() {
        return this.ratingValue;
    }

    ratingMin: number;
    ratingMax: number;
    ratingValue: number;
    ratingStep = 1;

    sliederComponent: any;
    tooltipVisible = false;

    constructor(
        injector: Injector,
        private _filtersService: FiltersService,
        private _ratingService: CustomerRatingsServiceProxy
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);

        this._filtersService.localizationSourceName = this.localizationSourceName;
    }

    toggle() {
        this.tooltipVisible = !this.tooltipVisible;
    }

    apply(selectedKeys = undefined) {
        this.selectedKeys = selectedKeys || this.selectedKeys;
        if (this.sliederComponent && this.selectedKeys && this.selectedKeys.length) {
            this.selectedKeys.forEach((key) => {
                this._ratingService.rateCustomer(RateCustomerInput.fromJS({
                    customerId: key,
                    ratingId: this.ratingValue
                })).subscribe((result) => {});
            });
            if (this.bulkUpdateMode)
                setTimeout(() => { this.ratingValue = this.ratingMin; }, 500);
        }
        this.tooltipVisible = false;
    }

    clear() {
        this.ratingValue = undefined;
        this.apply();
        this.ratingValue = this.ratingMin;
    }

    onInitialized($event) {
        this.sliederComponent = $event.component;
    }

    ngOnInit() {
        this._ratingService.getRatings().subscribe((result) => {
            if (result.length) {
                this.ratingMin = result[0].id;
                this.ratingMax = result[result.length - 1].id;
                if (!this.ratingValue)
                    this.ratingValue = this.ratingMin;
            }
        });
    }
}

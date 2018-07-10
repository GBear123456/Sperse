import { Component, Injector, OnInit, Input, EventEmitter, Output, AfterViewInit } from '@angular/core';

import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { FiltersService } from '@shared/filters/filters.service';
import { CustomerRatingsServiceProxy, RateCustomerInput, RateCustomersInput } from '@shared/service-proxies/service-proxies';

@Component({
  selector: 'crm-rating',
  templateUrl: './rating.component.html',
  styleUrls: ['./rating.component.less'],
  providers: [CustomerRatingsServiceProxy]
})
export class RatingComponent extends AppComponentBase implements OnInit, AfterViewInit {
    @Input() filterModel: any;
    @Input() selectedKeys: any;
    @Input() ratingValue: number;
    @Input() targetSelector = "[aria-label='Rating']";
    @Input() bulkUpdateMode = false;
    @Input() hideButtons = false;
    @Input() set selectedItemKey(value) {
        this.ratingValue = value;
    }
    get selectedItemKey() {
        return this.ratingValue;
    }
    @Output() onValueChanged: EventEmitter<any> = new EventEmitter();

    ratingMin: number;
    ratingMax: number;
    ratingStep = 1;

    sliderComponent: any;
    tooltipVisible = false;
    filtered: boolean = false;

    constructor(
        injector: Injector,
        private _filtersService: FiltersService,
        private _ratingService: CustomerRatingsServiceProxy
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
    }

    toggle() {
        if (this.tooltipVisible = !this.tooltipVisible)
            this.highlightSelectedFilters();
    }

    apply(selectedKeys = undefined) {
        this.selectedKeys = selectedKeys || this.selectedKeys;
        if (this.sliderComponent && this.selectedKeys && this.selectedKeys.length) {
            if (this.bulkUpdateMode) {
                this.message.confirm(
                    this.l('BulkUpdateConfirmation', this.selectedKeys.length),
                    isConfirmed => {
                        if (isConfirmed)
                            this.process();
                        else
                            this.ratingValue = this.ratingMin;
                    }
                );
            } else
                this.process();
        }
        this.tooltipVisible = false;
    }

    process() {
        if (this.bulkUpdateMode)
            this._ratingService.rateCustomers(RateCustomersInput.fromJS({
                customerIds: this.selectedKeys,
                ratingId: this.ratingValue
            })).finally(() => {
                this.ratingValue = this.ratingMin;
            }).subscribe((result) => {
                this.notify.success(this.l('CustomersRated'));
            });
        else
            this._ratingService.rateCustomer(RateCustomerInput.fromJS({
                customerId: this.selectedKeys[0],
                ratingId: this.ratingValue
            })).subscribe((result) => {
                this.notify.success(this.l('CustomersRated'));
            });
    }

    clear() {
        this.ratingValue = undefined;
        this.apply();
        this.ratingValue = this.ratingMin;
    }

    clearFilterHighlight() {
        this.filtered = false;
    }

    highlightSelectedFilters() {
        let filterModelItems = this.filterModel && this.filterModel.items;
        let filterId = filterModelItems && (filterModelItems.to.value || filterModelItems.from.value);
        this.clearFilterHighlight();
        if (this.sliderComponent && filterId) {
            this.ratingValue = filterId;
            this.filtered = true;
        }
    }

    applyFilter($event) {
        this.clearFilterHighlight();

        let filterValue = this.ratingValue;
        let modelItems = this.filterModel.items;
        if (modelItems.from.value == filterValue && modelItems.to.value == filterValue) {
            modelItems.from.value = modelItems.to.value = null;
        }
        else {
            modelItems.from.value = modelItems.to.value = filterValue;
            this.filtered = true;
        }
        this._filtersService.change(this.filterModel);
    }

    onInitialized($event) {
        this.sliderComponent = $event.component;
    }

    ngAfterViewInit(): void {
        this.highlightSelectedFilters();
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
    
    onValueChange(event) {
        this.onValueChanged.emit(event);
    }

    checkPermissions() {
        return this.permission.isGranted('Pages.CRM.Customers.ManageRatingAndStars') && 
            (!this.bulkUpdateMode || this.permission.isGranted('Pages.CRM.BulkUpdates'));
    }
}

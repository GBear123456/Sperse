/** Application imports */
import { Component, Injector, OnInit, Input, EventEmitter, Output, AfterViewInit } from '@angular/core';

/** Third party imports */
import { Store, select } from '@ngrx/store';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { CrmStore, RatingsStoreSelectors } from '@app/crm/store';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { FiltersService } from '@shared/filters/filters.service';
import { ContactGroupRatingsServiceProxy, ContactGroupRatingInfoDto, RateContactGroupInput, RateContactGroupsInput } from '@shared/service-proxies/service-proxies';

@Component({
  selector: 'crm-rating',
  templateUrl: './rating.component.html',
  styleUrls: ['./rating.component.less'],
  providers: [ContactGroupRatingsServiceProxy]
})
export class RatingComponent extends AppComponentBase implements OnInit, AfterViewInit {
    @Input() filterModel: any;
    @Input() selectedKeys: any;
    @Input() ratingValue: number;
    @Input() targetSelector = '[aria-label="Rating"]';
    @Input() bulkUpdateMode = false;
    @Input() hideButtons = false;
    @Input() set selectedItemKey(value) {
        this.ratingValue = value;
    }
    get selectedItemKey() {
        return this.ratingValue;
    }
    @Output() onValueChanged: EventEmitter<any> = new EventEmitter();
    @Output() onRatingUpdated: EventEmitter<any> = new EventEmitter();

    ratingMin: number;
    ratingMax: number;
    ratingStep = 1;

    sliderComponent: any;
    tooltipVisible = false;
    filtered = false;

    constructor(
        injector: Injector,
        private _filtersService: FiltersService,
        private _ratingService: ContactGroupRatingsServiceProxy,
        private store$: Store<CrmStore.State>
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
            this._ratingService.rateContactGroups(RateContactGroupsInput.fromJS({
                contactGroupIds: this.selectedKeys,
                ratingId: this.ratingValue
            })).pipe(finalize(() => {
                this.ratingValue = this.ratingMin;
            })).subscribe((result) => {
                this.onRatingUpdated.emit(this.ratingValue);
                this.notify.success(this.l('CustomersRated'));
            });
        else
            this._ratingService.rateContactGroup(RateContactGroupInput.fromJS({
                contactGroupId: this.selectedKeys[0],
                ratingId: this.ratingValue
            })).pipe(finalize(() => {
                if (!this.ratingValue)
                    this.ratingValue = this.ratingMin;
            })).subscribe((result) => {
                this.onRatingUpdated.emit(this.ratingValue);
                this.notify.success(this.l('CustomersRated'));
            });
    }

    clear() {
        this.ratingValue = undefined;
        this.apply();
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
        } else {
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
        this.store$.pipe(select(RatingsStoreSelectors.getRatings)).subscribe((result: ContactGroupRatingInfoDto[]) => {
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

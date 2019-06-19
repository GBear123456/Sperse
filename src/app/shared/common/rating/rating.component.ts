/** Application imports */
import { Component, OnInit, Input, EventEmitter, Output, AfterViewInit } from '@angular/core';

/** Third party imports */
import { Store, select } from '@ngrx/store';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { MessageService } from '@abp/message/message.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppStore, RatingsStoreSelectors } from '@app/store';
import { AppConsts } from '@shared/AppConsts';
import { FiltersService } from '@shared/filters/filters.service';

@Component({
  selector: 'app-rating',
  templateUrl: './rating.component.html',
  styleUrls: ['./rating.component.less']
})
export class AppRatingComponent implements OnInit, AfterViewInit {
    @Input() title = this.ls.l('Rating');
    @Input() filterModel: any;
    @Input() selectedKeys: any;
    @Input() ratingValue: number;
    @Input() targetSelector = '[aria-label="Rating"]';
    @Input() bulkUpdateMode = false;
    @Input() hideButtons = false;
    @Input() allowManage = false;

    @Output() onValueChanged: EventEmitter<any> = new EventEmitter();
    @Output() onProcess: EventEmitter<any> = new EventEmitter();

    ratingMin: number;
    ratingMax: number;
    ratingStep = 1;

    sliderComponent: any;
    tooltipVisible = false;
    filtered = false;

    constructor(
        public message: MessageService,
        public ls: AppLocalizationService,
        private _filtersService: FiltersService,
        private store$: Store<AppStore.State>
    ) {
    }

    reset() {
        this.ratingValue = this.ratingMin;    
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
                    this.ls.ls(AppConsts.localization.defaultLocalizationSourceName, 
                        'BulkUpdateConfirmation', this.selectedKeys.length),
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
        this.onProcess.emit(this.ratingValue);
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
        this.store$.pipe(select(RatingsStoreSelectors.getRatings)).subscribe((result: any[]) => {
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
}
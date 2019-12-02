/** Application imports */
import { Component, OnInit, Input, EventEmitter, Output, AfterViewInit } from '@angular/core';

/** Third party imports */
import { Store, select } from '@ngrx/store';
import { first } from 'rxjs/operators';

/** Application imports */
import { MessageService } from '@abp/message/message.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppStore, RatingsStoreSelectors } from '@app/store';
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
    @Input() emptyRatingValue = undefined;

    @Output() onValueChanged: EventEmitter<any> = new EventEmitter();
    @Output() onProcess: EventEmitter<number> = new EventEmitter();

    ratingMin: number;
    ratingMax: number;
    ratingStep = 1;

    sliderComponent: any;
    tooltipVisible = false;
    filtered = false;

    constructor(
        public ls: AppLocalizationService,
        private _message: MessageService,
        private _filtersService: FiltersService,
        private store$: Store<AppStore.State>
    ) {}

    ngAfterViewInit(): void {
        this.highlightSelectedFilters();
    }

    ngOnInit() {
        this.store$.pipe(select(RatingsStoreSelectors.getRatings)).pipe(first()).subscribe((result: any[]) => {
            if (result.length) {
                this.ratingMin = result[0].id;
                this.ratingMax = result[result.length - 1].id;
                if (!this.ratingValue)
                    this.ratingValue = this.ratingMin;
            }
        });
    }

    reset() {
        this.ratingValue = this.ratingMin;
    }

    toggle() {
        if (this.tooltipVisible = !this.tooltipVisible)
            this.highlightSelectedFilters();
    }

    apply(selectedKeys?, processValue?: number) {
        this.selectedKeys = selectedKeys || this.selectedKeys;
        if (this.sliderComponent && this.selectedKeys && this.selectedKeys.length) {
            if (this.bulkUpdateMode) {
                this._message.confirm(
                    this.ls.l('BulkUpdateConfirmation', this.selectedKeys.length),
                    isConfirmed => {
                        if (isConfirmed)
                            this.process(processValue);
                        else
                            this.ratingValue = this.ratingMin;
                    }
                );
            } else
                this.process(processValue);
        }
        this.tooltipVisible = false;
    }

    process(value: number = this.ratingValue) {
        this.onProcess.emit(value);
    }

    clear() {
        this.apply(undefined, this.emptyRatingValue);
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

    onValueChange(event) {
        this.onValueChanged.emit(event);
    }
}

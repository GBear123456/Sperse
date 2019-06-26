/** Application imports */
import { Component, Input, EventEmitter, Output, ViewChild } from '@angular/core';

/** Third party imports */
import { finalize } from 'rxjs/operators';

/** Application imports */
import { NotifyService } from '@abp/notify/notify.service';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppRatingComponent } from '@app/shared/common/rating/rating.component';
import { ContactRatingsServiceProxy, ContactRatingInfoDto, RateContactInput, RateContactsInput } from '@shared/service-proxies/service-proxies';

@Component({
  selector: 'crm-rating',
  templateUrl: './rating.component.html',
  styleUrls: ['./rating.component.less'],
  providers: [ContactRatingsServiceProxy]
})
export class RatingComponent {
    @ViewChild(AppRatingComponent) ratingComponent: AppRatingComponent;
    @Input() filterModel: any;
    @Input() selectedKeys: any;
    @Input() ratingValue: number;
    @Input() targetSelector = '[aria-label="Rating"]';
    @Input() bulkUpdateMode = false;
    @Input() hideButtons = false;

    @Output() onValueChanged: EventEmitter<any> = new EventEmitter();
    @Output() onRatingUpdated: EventEmitter<any> = new EventEmitter();

    constructor(
        public notify: NotifyService,
        public ls: AppLocalizationService,
        public permission: AppPermissionService,
        private _ratingService: ContactRatingsServiceProxy
    ) {
    }

    toggle() {
        this.ratingComponent.toggle();
    }

    reset() {
        this.ratingComponent.reset();
    }

    onProcess(ratingValue) {
        if (this.bulkUpdateMode)
            this._ratingService.rateContacts(RateContactsInput.fromJS({
                contactIds: this.selectedKeys,
                ratingId: ratingValue
            })).pipe(finalize(() => {
                this.ratingComponent.reset();
            })).subscribe((result) => {
                this.onRatingUpdated.emit(ratingValue);
                this.notify.success(this.ls.l('CustomersRated'));
            });
        else
            this._ratingService.rateContact(RateContactInput.fromJS({
                contactId: this.selectedKeys[0],
                ratingId: ratingValue
            })).pipe(finalize(() => {
                if (!ratingValue)
                    this.ratingComponent.reset();
            })).subscribe((result) => {
                this.onRatingUpdated.emit(ratingValue);
                this.notify.success(this.ls.l('CustomersRated'));
            });    
    }

    checkPermissions() {
        return this.permission.isGranted('Pages.CRM.Customers.ManageRatingAndStars') &&
            (!this.bulkUpdateMode || this.permission.isGranted('Pages.CRM.BulkUpdates'));
    }
}
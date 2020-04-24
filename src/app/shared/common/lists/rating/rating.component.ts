/** Application imports */
import { Component, Input, EventEmitter, Output, ViewChild } from '@angular/core';

/** Third party imports */
import { finalize } from 'rxjs/operators';

/** Application imports */
import { NotifyService } from '@abp/notify/notify.service';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { AppRatingComponent } from '@app/shared/common/rating/rating.component';
import { ContactRatingsServiceProxy, RateContactInput, RateContactsInput } from '@shared/service-proxies/service-proxies';
import { AppPermissions } from '@shared/AppPermissions';

@Component({
  selector: 'rating',
  templateUrl: './rating.component.html',
  providers: [ContactRatingsServiceProxy]
})
export class RatingComponent {
    @ViewChild(AppRatingComponent, { static: false }) ratingComponent: AppRatingComponent;
    @Input() filterModel: any;
    @Input() selectedKeys: any;
    @Input() ratingValue: number;
    @Input() targetSelector = '[aria-label="Rating"]';
    @Input() bulkUpdateMode = false;
    @Input() hideButtons = false;

    @Output() onValueChanged: EventEmitter<any> = new EventEmitter();
    @Output() onRatingUpdated: EventEmitter<any> = new EventEmitter();

    constructor(
        private notify: NotifyService,
        private ls: AppLocalizationService,
        private permission: AppPermissionService,
        private ratingService: ContactRatingsServiceProxy
    ) {}

    toggle() {
        this.ratingComponent.toggle();
    }

    reset() {
        this.ratingComponent.reset();
    }

    onProcess(ratingValue) {
        if (this.bulkUpdateMode)
            this.ratingService.rateContacts(RateContactsInput.fromJS({
                contactIds: this.selectedKeys,
                ratingId: ratingValue
            })).pipe(finalize(() => {
                this.ratingComponent.reset();
            })).subscribe((result) => {
                this.onRatingUpdated.emit(ratingValue);
                this.notify.success(this.ls.l('CustomersRated'));
            });
        else
            this.ratingService.rateContact(RateContactInput.fromJS({
                contactId: this.selectedKeys[0],
                ratingId: ratingValue
            })).pipe(finalize(() => {
                if (!ratingValue)
                    this.ratingComponent.reset();
            })).subscribe(() => {
                this.onRatingUpdated.emit(ratingValue);
                this.notify.success(this.ls.l('CustomersRated'));
            });
    }

    checkPermissions() {
        return this.permission.isGranted(AppPermissions.CRMCustomersManage) &&
            (!this.bulkUpdateMode || this.permission.isGranted(AppPermissions.CRMBulkUpdates));
    }
}

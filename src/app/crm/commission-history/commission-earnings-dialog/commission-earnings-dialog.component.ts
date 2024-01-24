/** Core imports */
import { Component, Injector, ElementRef } from '@angular/core';

/** Third party imports */
import * as moment from 'moment-timezone';
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';

/** Application imports */
import { AppPermissions } from '@shared/AppPermissions';
import { NotifyService } from 'abp-ng2-module';
import { ConfirmDialogComponent } from '@app/shared/common/dialogs/confirm/confirm-dialog.component';
import { RecordEarningsInput, CommissionServiceProxy, PendingCommissionContactInfo } from '@shared/service-proxies/service-proxies';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { ContactsHelper } from '@shared/crm/helpers/contacts-helper';
import { DateHelper } from '@shared/helpers/DateHelper';
import { SettingsHelper } from '../../../../shared/common/settings/settings.helper';

@Component({
    selector: 'commission-earnings-dialog',
    templateUrl: 'commission-earnings-dialog.component.html',
    styleUrls: ['commission-earnings-dialog.component.less']
})
export class CommissionEarningsDialogComponent extends ConfirmDialogComponent {
    currency = SettingsHelper.getCurrency();
    contacts$: Observable<PendingCommissionContactInfo[]> = this.commissionProxy.getPendingCommissionContacts(this.currency).pipe(
        map(data => data.sort((prev: PendingCommissionContactInfo, next: PendingCommissionContactInfo) => {
            return prev.name.localeCompare(next.name);
        }))
    );
    calendarOptions = { allowFutureDates: false };
    selectedContactIds: number[];
    dateRange = {
        from: { value: DateHelper.addTimezoneOffset(moment().startOf('day').toDate(), true) },
        to: { value: DateHelper.addTimezoneOffset(moment().endOf('day').toDate(), true) }
    };

    constructor(
        injector: Injector,
        public elementRef: ElementRef,
        private notify: NotifyService,
        private loadingService: LoadingService,
        private commissionProxy: CommissionServiceProxy
    ) {
        super(injector);
    }

    confirm() {
        if (this.selectedContactIds && this.selectedContactIds.length &&
            (this.selectedContactIds.length == 1 || this.data.bulkUpdateAllowed) ||
            (!this.selectedContactIds && this.data.bulkUpdateAllowed)
        ) {
            ContactsHelper.showConfirmMessage(
                this.ls.l('NewEarningsAdd'),
                (isConfirmed: boolean) => {
                    if (isConfirmed && (this.dateRange.to.value || this.dateRange.from.value)) {
                        this.loadingService.startLoading(this.elementRef.nativeElement);
                        this.commissionProxy.recordEarnings(
                            new RecordEarningsInput({
                                contactIds: this.selectedContactIds && this.selectedContactIds.length 
                                    ? this.selectedContactIds : undefined,
                                startDate: DateHelper.removeTimezoneOffset(new Date(
                                    (this.dateRange.from.value || this.dateRange.to.value).getTime()), true, 'from'),
                                endDate: DateHelper.removeTimezoneOffset(new Date(
                                    (this.dateRange.to.value || this.dateRange.from.value).getTime()), true, 'to'),
                                currencyId: this.currency
                            })
                        ).pipe(
                            finalize(() => this.loadingService.finishLoading(this.elementRef.nativeElement))
                        ).subscribe(() => {
                            this.notify.success(this.ls.l('AppliedSuccessfully'));
                            this.dialogRef.close();
                        });
                    }
                }, [ ]
            );
        } else
            this.notify.error(this.ls.l('AtLeastOneOfThesePermissionsMustBeGranted', AppPermissions.CRMBulkUpdates));
    }

    getSelectedName(contactList) {
        if (this.selectedContactIds && this.selectedContactIds.length) {
            let selectedItem = contactList.find(
                item => item.id == this.selectedContactIds[0]
            ), name = selectedItem && (selectedItem.name || selectedItem.affiliateCode),
            count = this.selectedContactIds.length - 1;
            return count > 0 ? name + ` + ${count}` : name;
        }
    }
}
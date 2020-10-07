/** Core imports */
import { Component, Injector, ElementRef } from '@angular/core';

/** Third party imports */
import * as moment from 'moment-timezone';
import { Observable } from 'rxjs';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { AppPermissions } from '@shared/AppPermissions';
import { NotifyService } from '@abp/notify/notify.service';
import { ConfirmDialogComponent } from '@app/shared/common/dialogs/confirm/confirm-dialog.component';
import { RecordEarningsInput, CommissionServiceProxy, PendingCommissionContactInfo } from '@shared/service-proxies/service-proxies';
import { CalendarValuesModel } from '@shared/common/widgets/calendar/calendar-values.model';
import { DateHelper } from '@shared/helpers/DateHelper';

@Component({
    selector: 'commission-ernings-dialog',
    templateUrl: 'commission-ernings-dialog.component.html',
    styleUrls: ['commission-ernings-dialog.component.less']
})
export class CommissionErningsDialogComponent extends ConfirmDialogComponent {
    contacts$: Observable<PendingCommissionContactInfo[]> = this.commissionProxy.getPendingCommissionContacts();
    calendarOptions = { allowFutureDates: false };
    contactId: number;
    dateRange = {
        from: { value: DateHelper.addTimezoneOffset(moment().startOf('day').toDate(), true) },
        to: { value: DateHelper.addTimezoneOffset(moment().endOf('day').toDate(), true) }
    };

    constructor(
        injector: Injector,
        public elementRef: ElementRef,
        private notify: NotifyService,
        private commissionProxy: CommissionServiceProxy
    ) {
        super(injector);
    }

    confirm() {
        if (this.contactId || this.data.bulkUpdateAllowed) {
            abp.ui.setBusy(this.elementRef.nativeElement);
            this.commissionProxy.recordEarnings(
                new RecordEarningsInput({
                    contactId: this.contactId,
                    startDate: DateHelper.removeTimezoneOffset(new Date(this.dateRange.from.value.getTime()), true, 'from'),
                    endDate: DateHelper.removeTimezoneOffset(new Date(this.dateRange.to.value.getTime()), true, 'to')
                })
            ).pipe(
                finalize(() => abp.ui.clearBusy(this.elementRef.nativeElement))
            ).subscribe(() => {                
                this.dialogRef.close();
            });
        } else
            this.notify.error(this.ls.l('AtLeastOneOfThesePermissionsMustBeGranted', AppPermissions.CRMBulkUpdates));
    }
}
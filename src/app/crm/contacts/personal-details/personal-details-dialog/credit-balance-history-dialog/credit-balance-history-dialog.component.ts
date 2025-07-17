/** Core imports */
import {
    ChangeDetectorRef, ChangeDetectionStrategy,
    Component, Inject, OnInit, ViewChild
} from '@angular/core';

/** Third party imports */
import * as moment from 'moment';
import { finalize } from 'rxjs/operators';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

/** Application imports */
import { CreditBalanceServiceProxy, CreditBalanceHistoryInfo } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { ProfileService } from '@shared/common/profile-service/profile.service';

@Component({
    templateUrl: 'credit-balance-history-dialog.component.html',
    styleUrls: [
        '../../../../../../shared/metronic/m-alert.less',
        '../../../../../../shared/metronic/m-helpers.less',
        'credit-balance-history-dialog.component.less'
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [CreditBalanceServiceProxy]
})
export class CreditBalanceHistoryDialogComponent implements OnInit {
    @ViewChild(ModalDialogComponent, { static: true }) modalDialog: ModalDialogComponent;
    creditBalanceHistory: CreditBalanceHistoryInfo[] = [];

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        private changeDetectorRef: ChangeDetectorRef,
        private creditBalanceProxy: CreditBalanceServiceProxy,
        public dialogRef: MatDialogRef<CreditBalanceHistoryDialogComponent>,
        public profileService: ProfileService,
        public ls: AppLocalizationService
    ) { }

    ngOnInit() {
        this.modalDialog.startLoading();
        this.creditBalanceProxy.getContactBalanceHistory(this.data.contactId)
            .pipe(finalize(() => this.modalDialog.finishLoading()))
            .subscribe((result: CreditBalanceHistoryInfo[]) => {
                this.creditBalanceHistory = result;
                this.changeDetectorRef.detectChanges();
            });
    }

    getTime(data: CreditBalanceHistoryInfo): string {
        return moment(data.dateTime).fromNow() + ' (' + moment(data.dateTime).format('YYYY-MM-DD hh:mm:ss') + ')';
    }
}

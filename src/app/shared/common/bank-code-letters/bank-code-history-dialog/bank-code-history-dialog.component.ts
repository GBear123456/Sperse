/** Core imports */
import { ChangeDetectorRef, ChangeDetectionStrategy,
    Component, Inject, OnInit, ViewChild } from '@angular/core';

/** Third party imports */
import * as moment from 'moment';
import { finalize } from 'rxjs/operators';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

/** Application imports */
import { BankCodeHistoryInfo, BANKCodeServiceProxy, BANKCodeSelfAssessmentDto } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { ProfileService } from '@shared/common/profile-service/profile.service';

@Component({
    templateUrl: 'bank-code-history-dialog.component.html',
    styleUrls: [
        '../../../../../shared/metronic/m-alert.less',
        '../../../../../shared/metronic/m-helpers.less',
        'bank-code-history-dialog.component.less'
    ],
    providers: [BANKCodeServiceProxy],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class BankCodeHistoryDialogComponent implements OnInit {
    @ViewChild(ModalDialogComponent, { static: true }) modalDialog: ModalDialogComponent;
    bankCodeHistory: BankCodeHistoryInfo[] = [];

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        private changeDetectorRef: ChangeDetectorRef,
        private bankCodeProxy: BANKCodeServiceProxy,
        public dialogRef: MatDialogRef<BankCodeHistoryDialogComponent>,
        public profileService: ProfileService,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {
        this.modalDialog.startLoading();
        this.bankCodeProxy.getBankCodeHistory(this.data.contactId)
            .pipe(finalize(() => this.modalDialog.finishLoading()))
            .subscribe((result: BankCodeHistoryInfo[]) => {
                this.bankCodeHistory = result;
                this.changeDetectorRef.detectChanges();
            });
    }

    getBankCodeAssessment(info: BankCodeHistoryInfo): BANKCodeSelfAssessmentDto {
        if (!info.selfAssessmentB)
            return null;

        return new BANKCodeSelfAssessmentDto({
            b: info.selfAssessmentB,
            a: info.selfAssessmentA,
            n: info.selfAssessmentN,
            k: info.selfAssessmentK
        });
    }

    getBankCodeTime(info: BankCodeHistoryInfo): string {
        return moment(info.dateTime).fromNow() + ' (' + moment(info.dateTime).format('YYYY-MM-DD hh:mm:ss') + ')';
    }
}

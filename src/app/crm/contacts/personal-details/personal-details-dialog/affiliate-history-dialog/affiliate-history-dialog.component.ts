/** Core imports */
import { ChangeDetectorRef, ChangeDetectionStrategy,
    Component, Inject, OnInit, ViewChild } from '@angular/core';

/** Third party imports */
import * as moment from 'moment';
import { finalize } from 'rxjs/operators';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

/** Application imports */
import { ContactServiceProxy, AffiliateInfoHistoryInfo } from '@shared/service-proxies/service-proxies';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';
import { ProfileService } from '@shared/common/profile-service/profile.service';
import { FeatureCheckerService } from 'abp-ng2-module';
import { AppFeatures } from '@shared/AppFeatures';

@Component({
    templateUrl: 'affiliate-history-dialog.component.html',
    styleUrls: [
        '../../../../../../shared/metronic/m-alert.less',
        '../../../../../../shared/metronic/m-helpers.less',
        'affiliate-history-dialog.component.less'
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class AffiliateHistoryDialogComponent implements OnInit {
    @ViewChild(ModalDialogComponent, { static: true }) modalDialog: ModalDialogComponent;
    affiliateHistory: AffiliateInfoHistoryInfo[] = [];
    hasCommissionsFeature: boolean = this.featureCheckerService.isEnabled(AppFeatures.CRMCommissions);

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: any,
        private changeDetectorRef: ChangeDetectorRef,
        private contactProxy: ContactServiceProxy,
        private featureCheckerService: FeatureCheckerService,
        public dialogRef: MatDialogRef<AffiliateHistoryDialogComponent>,
        public profileService: ProfileService,
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {
        this.modalDialog.startLoading();
        this.contactProxy.getAffiliateHistory(this.data.contactId)
            .pipe(finalize(() => this.modalDialog.finishLoading()))
            .subscribe((result: AffiliateInfoHistoryInfo[]) => {
                this.affiliateHistory = result.reverse();
                this.changeDetectorRef.detectChanges();
            });
    }

    getAffiliateTime(affiliate): string {
        return moment(affiliate.dateTime).fromNow() + ' (' + moment(affiliate.dateTime).format('YYYY-MM-DD hh:mm:ss') + ')';
    }
}

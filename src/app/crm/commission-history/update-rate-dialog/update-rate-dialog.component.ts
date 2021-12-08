/** Core imports */
import { Component, Injector, ElementRef, ViewChild } from '@angular/core';

/** Third party imports */
import { finalize } from 'rxjs/operators';
import { DxNumberBoxComponent } from 'devextreme-angular/ui/number-box';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppPermissions } from '@shared/AppPermissions';
import { NotifyService } from '@abp/notify/notify.service';
import { ConfirmDialogComponent } from '@app/shared/common/dialogs/confirm/confirm-dialog.component';
import { CommissionServiceProxy, UpdateCommissionRateInput } from '@shared/service-proxies/service-proxies';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { ContactsHelper } from '@shared/crm/helpers/contacts-helper';

@Component({
    selector: 'update-rate-dialog',
    templateUrl: 'update-rate-dialog.component.html',
    styleUrls: ['update-rate-dialog.component.less']
})
export class UpdateCommissionRateDialogComponent extends ConfirmDialogComponent {
    @ViewChild(DxNumberBoxComponent) rateComponent: DxNumberBoxComponent;

    affiliateRate: number = 0;
    affiliateRateValidationRules = [
        {
            type: 'required',
            message: this.ls.l('RequiredField', this.ls.l('AffiliateRate'))
        },
        {
            type: 'pattern',
            pattern: AppConsts.regexPatterns.affiliateRate,
            message: this.ls.l('InvalidAffiliateRate')
        },
        {
            type: 'stringLength',
            max: AppConsts.maxAffiliateRateLength,
            message: this.ls.l('MaxLengthIs', AppConsts.maxAffiliateRateLength)
        }
    ];

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
        if (!this.rateComponent.instance.option('isValid'))
            return this.notify.error(this.ls.l('InvalidAffiliateRate'));

        if (this.data.entityIds.length <= 1 || this.data.bulkUpdateAllowed) {
            ContactsHelper.showConfirmMessage(
                this.ls.l('UpdateCommissionRate'),
                (isConfirmed: boolean) => {
                    if (isConfirmed) {
                        this.loadingService.startLoading(this.elementRef.nativeElement);
                        this.commissionProxy.updateCommissionRate(new UpdateCommissionRateInput({
                            commissionIds: this.data.entityIds,
                            commissionRate: Number((this.affiliateRate / 100).toFixed(4))
                        })).pipe(
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
}
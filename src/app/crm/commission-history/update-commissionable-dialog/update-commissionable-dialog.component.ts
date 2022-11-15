/** Core imports */
import { Component, Injector, ElementRef } from '@angular/core';

/** Third party imports */
import { finalize } from 'rxjs/operators';

/** Application imports */
import { AppPermissions } from '@shared/AppPermissions';
import { NotifyService } from 'abp-ng2-module';
import { ConfirmDialogComponent } from '@app/shared/common/dialogs/confirm/confirm-dialog.component';
import { CommissionServiceProxy, UpdateCommissionableAmountInput } from '@shared/service-proxies/service-proxies';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { ContactsHelper } from '@shared/crm/helpers/contacts-helper';
import { SettingsHelper } from '@shared/common/settings/settings.helper';

@Component({
    selector: 'update-commissionable-dialog',
    templateUrl: 'update-commissionable-dialog.component.html',
    styleUrls: ['update-commissionable-dialog.component.less']
})
export class UpdateCommissionableDialogComponent extends ConfirmDialogComponent {
    amount = 0;
    currency: string = SettingsHelper.getCurrency();

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
        if (this.data.entityIds.length <= 1 || this.data.bulkUpdateAllowed) {
            ContactsHelper.showConfirmMessage(
                this.ls.l('UpdateCommissionableAmount'),
                (isConfirmed: boolean) => {
                    if (isConfirmed) {
                        this.loadingService.startLoading(this.elementRef.nativeElement);
                        this.commissionProxy.updateCommissionableAmount(new UpdateCommissionableAmountInput({
                            commissionIds: this.data.entityIds,
                            commissionableAmount: this.amount || 0
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
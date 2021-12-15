/** Core imports */
import { Component, Injector, ElementRef } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { finalize, map } from 'rxjs/operators';
import DataSource from 'devextreme/data/data_source';
import ODataStore from 'devextreme/data/odata/store';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { NotifyService } from 'abp-ng2-module';
import { ODataService } from '@shared/common/odata/odata.service';
import { ResellersFields } from '@app/crm/commission-history/resellers-fields.enum';
import { ConfirmDialogComponent } from '@app/shared/common/dialogs/confirm/confirm-dialog.component';
import { CommissionServiceProxy, RequestWithdrawalInput, InvoiceSettings } from '@shared/service-proxies/service-proxies';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { InvoicesService } from '@app/crm/contacts/invoices/invoices.service';
import { ContactsHelper } from '@shared/crm/helpers/contacts-helper';
import { DateHelper } from '@shared/helpers/DateHelper';

@Component({
    selector: 'request-withdrawal-dialog',
    templateUrl: 'request-withdrawal-dialog.component.html',
    styleUrls: ['request-withdrawal-dialog.component.less']
})
export class RequestWithdrawalDialogComponent extends ConfirmDialogComponent {

    searchTimeout;
    selectedContact;
    searchValue: string;
    withdrawalAmount: number;
    dataSource = new DataSource({
        requireTotalCount: true,
        store: new ODataStore({
            key: ResellersFields.Id,
            url: this.oDataService.getODataUrl('AffiliateSummaryReport'),
            version: AppConsts.ODataVersion,
            beforeSend: (request) => {
                request.headers['Authorization'] = 'Bearer ' + abp.auth.getToken();
                request.timeout = AppConsts.ODataRequestTimeoutMilliseconds;
                request.params.$filter = '(AvailableBalance gt 0)' +
                    (this.searchValue ? ' and contains(FullName, \'' + this.searchValue + '\')' : '');
                request.params.$select = [
                    ResellersFields.Id,
                    ResellersFields.FullName,
                    ResellersFields.AvailableBalance
                ];
            }
        })
    });

    currency$: Observable<string> = this.invoicesService.settings$.pipe(
        map((settings: InvoiceSettings) => settings && settings.currency)
    );
    today: Date = DateHelper.addTimezoneOffset(new Date(), true);
    date: Date = this.today;

    constructor(
        injector: Injector,
        public elementRef: ElementRef,
        private notify: NotifyService,
        private oDataService: ODataService,
        private loadingService: LoadingService,
        private invoicesService: InvoicesService,
        private commissionProxy: CommissionServiceProxy
    ) {
        super(injector);
    }

    confirm() {
        if (this.selectedContact && this.withdrawalAmount) {
            ContactsHelper.showConfirmMessage(
                this.ls.l('CreateWithdrawalRequest'),
                (isConfirmed: boolean) => {
                    if (isConfirmed) {
                        this.loadingService.startLoading(this.elementRef.nativeElement);
                        this.commissionProxy.requestWithdrawal(new RequestWithdrawalInput({
                            contactId: this.selectedContact.Id,
                            amount: this.withdrawalAmount,
                            date: DateHelper.removeTimezoneOffset(this.date, true,
                                DateHelper.isSameDateWithoutTime(this.date, this.today) ? undefined : 'from')
                        })).pipe(finalize(
                            () => this.loadingService.finishLoading(this.elementRef.nativeElement)
                        )).subscribe(() => {
                            this.notify.success(this.ls.l('SuccessfullyAdded'));
                            this.dialogRef.close();
                        });
                    }
                }, []
            );
        } else
            this.notify.error(this.ls.l('ContactAndAmountRequired'));
    }

    onKeyUp(event) {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            let searchValue = event.component.option('value');
            if (this.searchValue != searchValue) {
                this.searchValue = searchValue;
                this.dataSource.reload();
            }
        }, 600);
    }

    onSelectionChanged(event) {
        this.withdrawalAmount = event.selectedItem.AvailableBalance;
    }
}
/** Core imports */
import {
    Component,
    ChangeDetectionStrategy,
    Output,
    EventEmitter,
    Input,
    ChangeDetectorRef, ElementRef
} from '@angular/core';

/** Third party imports */
import { of } from 'rxjs';
import { finalize, mapTo, switchMap } from 'rxjs/operators';

/** Application imports */
import {
    SyncAccountServiceProxy,
    CreateSyncAccountInput,
    CategoryTreeServiceProxy,
    UpdateSyncAccountInput
} from 'shared/service-proxies/service-proxies';
import { AppConsts } from '@shared/AppConsts';
import { SyncTypeIds } from '@shared/AppEnums';
import { SynchProgressService } from '@shared/cfo/bank-accounts/helpers/synch-progress.service';
import { SyncDto } from '@shared/service-proxies/service-proxies';
import { CFOService } from '@shared/cfo/cfo.service';
import { NotifyService } from '@abp/notify/notify.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'xero-login',
    templateUrl: './xero-login.component.html',
    styleUrls: ['./xero-login.component.less'],
    providers: [ SyncAccountServiceProxy, CategoryTreeServiceProxy ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class XeroLoginComponent {
    @Input() operationType: 'add' | 'update' = 'add';
    @Input() accountId: number;
    @Input() isSyncBankAccountsEnabled = true;
    @Input() overwriteCurrentCategoryTree = false;
    @Output() onComplete: EventEmitter<number> = new EventEmitter();
    @Output() onClose: EventEmitter<null> = new EventEmitter();
    importNewCategoryTree = true;
    consumerKey: string;
    consumerSecret: string;
    xeroAppsLink = 'https://developer.xero.com/myapps';
    getXeroCertificateUrl: string;

    constructor(
        private _syncAccountServiceProxy: SyncAccountServiceProxy,
        private _syncProgressService: SynchProgressService,
        private _categoryTreeServiceProxy: CategoryTreeServiceProxy,
        private _cfoService: CFOService,
        private _notifyService: NotifyService,
        private _changeDetectorRef: ChangeDetectorRef,
        private _elementRef: ElementRef,
        public ls: AppLocalizationService
    ) {
        this.getXeroCertificateUrl = AppConsts.remoteServiceBaseUrl + '/api/Xero/GetCertificate';
    }

    onClick(event) {
        let result = event.validationGroup.validate();
        if (result.isValid) {
            if (this.accountId)
                this.updateSyncAccount();
            else
                this.connectToXero(event);
        }
    }

    connectToXero(e) {
        abp.ui.setBusy(this._elementRef.nativeElement);
        this._syncAccountServiceProxy.create(
            <any>this._cfoService.instanceType,
            this._cfoService.instanceId,
            new CreateSyncAccountInput({
                typeId: SyncTypeIds.Xero,
                consumerKey: this.consumerKey,
                consumerSecret: this.consumerSecret,
                isSyncBankAccountsEnabled: this.isSyncBankAccountsEnabled
            })
        )
            .pipe(
                switchMap((syncAccountId: number) => {
                    let request$ = of(syncAccountId);
                    if (this.importNewCategoryTree) {
                        let syncInput = SyncDto.fromJS({
                            syncAccountId: syncAccountId
                        });
                        request$ = this._categoryTreeServiceProxy.sync(
                            <any>this._cfoService.instanceType,
                            this._cfoService.instanceId,
                            syncInput,
                            this.overwriteCurrentCategoryTree
                        ).pipe(mapTo(syncAccountId));
                    }
                    return request$;
                }),
                finalize(this.finalize)
            )
            .subscribe((syncAccountId: number) => {
                this._notifyService.info(this.ls.l('SavedSuccessfully'));
                this.onComplete.emit(syncAccountId);
                this.onClose.emit();
                this._syncProgressService.startSynchronization(true, false, SyncTypeIds.Xero, [ syncAccountId ]);
            });
    }

    updateSyncAccount() {
        abp.ui.setBusy(this._elementRef.nativeElement);
        const accountId = this.accountId;
        this._syncAccountServiceProxy.update(<any>this._cfoService.instanceType, this._cfoService.instanceId,
            new UpdateSyncAccountInput({
                id: accountId,
                consumerKey: this.consumerKey,
                consumerSecret: this.consumerSecret
            }))
            .pipe(finalize(this.finalize))
            .subscribe(() => {
                this.onComplete.emit();
                this.onClose.emit();
                this._syncProgressService.startSynchronization(true, false, SyncTypeIds.Xero, [ accountId ]);
            });
    }

    finalize = () => {
        abp.ui.clearBusy(this._elementRef.nativeElement);
        this._changeDetectorRef.detectChanges();
    }
}

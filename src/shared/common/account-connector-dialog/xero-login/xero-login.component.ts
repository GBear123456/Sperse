/** Core imports */
import {
    Component,
    ChangeDetectionStrategy,
    Injector,
    Output,
    EventEmitter,
    Input,
    OnInit,
    ChangeDetectorRef
} from '@angular/core';

/** Third party imports */
import { of } from 'rxjs';
import { finalize, switchMap } from 'rxjs/operators';

/** Application imports */
import {
    SyncAccountServiceProxy,
    CreateSyncAccountInput,
    CategoryTreeServiceProxy,
    InstanceType43,
    InstanceType87,
    InstanceType88,
    UpdateSyncAccountInput
} from 'shared/service-proxies/service-proxies';
import { AppConsts } from 'shared/AppConsts';
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
export class XeroLoginComponent implements OnInit {
    @Input() operationType: 'add' | 'update' = 'add';
    @Input() accountId: number;
    @Input() isSyncBankAccountsEnabled = true;
    @Input() importCategoryTree = false;
    @Output() onComplete: EventEmitter<null> = new EventEmitter();
    @Output() onClose: EventEmitter<null> = new EventEmitter();
    consumerKey: string;
    consumerSecret: string;
    xeroAppsLink = 'https://developer.xero.com/myapps';
    getXeroCertificateUrl: string;
    overlayElement;

    constructor(
        injector: Injector,
        private _syncAccountServiceProxy: SyncAccountServiceProxy,
        private _syncProgressService: SynchProgressService,
        private _categoryTreeServiceProxy: CategoryTreeServiceProxy,
        private _cfoService: CFOService,
        private _notifyService: NotifyService,
        private _changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService
    ) {
        this.getXeroCertificateUrl = AppConsts.remoteServiceBaseUrl + '/api/Xero/GetCertificate';
    }

    ngOnInit() {
        this.overlayElement = document.querySelector('.dx-overlay-wrapper.xeroLoginDialog .dx-overlay-content');
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
        abp.ui.setBusy(this.overlayElement);
        this._syncAccountServiceProxy.create(
            this._cfoService.instanceType as InstanceType87,
            this._cfoService.instanceId,
            new CreateSyncAccountInput({
                typeId: 'X',
                consumerKey: this.consumerKey,
                consumerSecret: this.consumerSecret,
                isSyncBankAccountsEnabled: this.isSyncBankAccountsEnabled
            })
        )
            .pipe(
                switchMap(syncAccountId => {
                    let request$ = of(null);
                    if (this.importCategoryTree) {
                        let syncInput = SyncDto.fromJS({
                            syncAccountId: syncAccountId
                        });
                        request$ = this._categoryTreeServiceProxy.sync(
                            this._cfoService.instanceType as InstanceType43,
                            this._cfoService.instanceId, syncInput,
                            this.importCategoryTree
                        );
                    }
                    return request$;
                }),
                finalize(this.finalize)
            )
            .subscribe(() => {
                this._notifyService.info(this.ls.l('SavedSuccessfully'));
                this.onComplete.emit();
                this._syncProgressService.startSynchronization(true, true, 'X');
            });
    }

    updateSyncAccount() {
        abp.ui.setBusy(this.overlayElement);
        this._syncAccountServiceProxy.update(this._cfoService.instanceType as InstanceType88, this._cfoService.instanceId,
            new UpdateSyncAccountInput({
                id: this.accountId,
                consumerKey: this.consumerKey,
                consumerSecret: this.consumerSecret
            }))
            .pipe(finalize(this.finalize))
            .subscribe(() => {
                this.onComplete.emit();
                this._syncProgressService.startSynchronization(true, false, 'X');
            });
    }

    finalize = () => {
        abp.ui.clearBusy(this.overlayElement);
        this.onClose.emit();
        this.consumerKey = null;
        this.consumerSecret = null;
        this._changeDetectorRef.detectChanges();
    }
}

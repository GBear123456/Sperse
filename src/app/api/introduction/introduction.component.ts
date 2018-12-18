import { Component, OnInit, OnDestroy, Injector } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';

import { appModuleAnimation } from '@shared/animations/routerTransition';
import { ApiKeyServiceProxy, ApiKeyInfo, GenerateApiKeyInput } from '@shared/service-proxies/service-proxies';
import { MatDialog } from '@angular/material';
import { EditKeyDialog } from '@app/api/introduction/add-key-dialog/add-key-dialog.component';

@Component({
    templateUrl: './introduction.component.html',
    styleUrls: ['./introduction.component.less'],
    animations: [appModuleAnimation()],
    providers: [ApiKeyServiceProxy]
})
export class IntroductionComponent extends AppComponentBase implements OnInit, OnDestroy {
    public headlineConfig = {
        names: [this.l('Interactive API Documentation')],
        iconSrc: './assets/common/icons/api-icon.svg',
        buttons: []
    };

    public apiKeys: ApiKeyInfo[];
    private elementForBlocking: Element;

    constructor(injector: Injector,
        public dialog: MatDialog,
        private _apiKeyService: ApiKeyServiceProxy) {
        super(injector);
    }

    addApiKey() {
        this.dialog.open(EditKeyDialog, {})
            .afterClosed()
            .subscribe((result: GenerateApiKeyInput) => {
                if (result) {
                    this._apiKeyService.generate(result).subscribe(result => {
                        this.loadApiKeys();
                        abp.notify.success(this.l('SuccessfullySaved'));
                    });
                }
            });
    }

    ngOnInit(): void {
        this.getRootComponent().overflowHidden(true);

        this.elementForBlocking = document.querySelector('.api-into');
        this.loadApiKeys();
    }

    loadApiKeys() {
        abp.ui.setBusy(this.elementForBlocking);
        this._apiKeyService.getAll(abp.session.userId)
            .subscribe((apiKeys) => {
                abp.ui.clearBusy(this.elementForBlocking);

                this.apiKeys = apiKeys && apiKeys.length ? apiKeys : null;
            });
    }

    deleteApiKey(data) {
        abp.message.confirm('', this.l('DeleteConfiramtion'), result => {
            if (result) {
                abp.ui.setBusy(this.elementForBlocking);
                this._apiKeyService.delete(data.key)
                    .subscribe(() => {
                        abp.ui.clearBusy(this.elementForBlocking);
                        this.loadApiKeys();
                        abp.notify.info(this.l('SuccessfullyDeleted'));
                    });
            };
        });
    }

    ngOnDestroy() {
        this.getRootComponent().overflowHidden();
    }
}

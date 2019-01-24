import { Component, OnInit, OnDestroy, Injector } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';

import { ClipboardService } from 'ngx-clipboard';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { ApiKeyServiceProxy, ApiKeyInfo, GenerateApiKeyInput } from '@shared/service-proxies/service-proxies';
import { MatDialog } from '@angular/material/dialog';
import { EditKeyDialog } from '@app/api/introduction/add-key-dialog/add-key-dialog.component';
import * as _ from 'lodash';

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
        private _apiKeyService: ApiKeyServiceProxy,
        private _clipboardService: ClipboardService) {
        super(injector);
    }

    addApiKey() {
        this.dialog.open(EditKeyDialog, {})
            .afterClosed()
            .subscribe((result: GenerateApiKeyInput) => {
                if (result) {
                    this._apiKeyService.generate(result).subscribe(result => {
                        if (!this.apiKeys) this.apiKeys = [];
                        this.apiKeys.unshift(result);
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
        this._apiKeyService.getAll(undefined)
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
                        if (this.apiKeys.length == 1)
                            this.apiKeys = [];
                        else
                            _.remove(this.apiKeys, x => x.id == data.key);

                        abp.notify.info(this.l('SuccessfullyDeleted'));
                    });
            };
        });
    }

    copyToClipboard(text) {
        this._clipboardService.copyFromContent(text);
        abp.notify.info(this.l('Copied'));
    }

    ngOnDestroy() {
        this.getRootComponent().overflowHidden();
    }
}

/** Core imports */
import { Component, OnInit, OnDestroy, Injector } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { ClipboardService } from 'ngx-clipboard';
import remove from 'lodash/remove';

/** Application imports */
import { AppComponentBase } from '@shared/common/app-component-base';
import { ApiKeyServiceProxy, ApiKeyInfo, GenerateApiKeyInput, UpdateApiKeyInput } from '@shared/service-proxies/service-proxies';
import { EditKeyDialog } from '@app/api/introduction/add-key-dialog/add-key-dialog.component';
import { AppPermissions } from '@shared/AppPermissions';
import { AppService } from '@app/app.service';

@Component({
    templateUrl: './introduction.component.html',
    styleUrls: ['./introduction.component.less'],
    providers: [ ApiKeyServiceProxy ]
})
export class IntroductionComponent extends AppComponentBase implements OnInit, OnDestroy {
    toggleTooltip = false;
    public apiKeys: ApiKeyInfo[];
    private elementForBlocking: Element;
    scrollHeight: number = window.innerHeight - 149;
    canManageApiKeys = this.permission.isGranted(AppPermissions.APIManageKeys);

    constructor(
        injector: Injector,
        public dialog: MatDialog,
        private apiKeyService: ApiKeyServiceProxy,
        private clipboardService: ClipboardService,
        private appService: AppService
    ) {
        super(injector);
    }

    addUpdateApiKey(data?) {
        this.dialog.open(EditKeyDialog, {data})
            .afterClosed()
            .subscribe((result: GenerateApiKeyInput | UpdateApiKeyInput) => {
                if (result) {
                    if (result instanceof UpdateApiKeyInput)
                        this.apiKeyService.update(<UpdateApiKeyInput>result).subscribe(() => {
                            this.apiKeys.some(item => {
                                if (item.id == (<UpdateApiKeyInput>result).id) {
                                    item.name = result.name;
                                    item.expirationDate = result.expirationDate;
                                    item.userId = result.userId;
                                    item.paths = result.paths;
                                }
                            });
                            this.loadApiKeys();
                            abp.notify.success(this.l('SuccessfullySaved'));
                        });
                    else
                        this.apiKeyService.generate(<GenerateApiKeyInput>result).subscribe(result => {
                            if (!this.apiKeys) this.apiKeys = [];
                            this.apiKeys.unshift(result);
                            abp.notify.success(this.l('SuccessfullySaved'));
                        });
                }
            });
    }

    ngOnInit(): void {
        this.appService.isClientSearchDisabled = true;
        this.getRootComponent().overflowHidden(true);

        this.elementForBlocking = document.querySelector('.api-into');
        this.loadApiKeys();
    }

    loadApiKeys() {
        abp.ui.setBusy(this.elementForBlocking);
        this.apiKeyService.getAll(undefined)
            .subscribe((apiKeys) => {
                abp.ui.clearBusy(this.elementForBlocking);
                this.apiKeys = apiKeys && apiKeys.length ? apiKeys : null;
                this.showTooltip();
            });
    }

    deleteApiKey(data) {
        abp.message.confirm('', this.l('DeleteConfiramtion'), result => {
            if (result) {
                abp.ui.setBusy(this.elementForBlocking);
                this.apiKeyService.delete(data.key)
                    .subscribe(() => {
                        abp.ui.clearBusy(this.elementForBlocking);
                        if (this.apiKeys.length == 1)
                            this.apiKeys = [];
                        else
                            remove(this.apiKeys, x => x.id == data.key);

                        abp.notify.info(this.l('SuccessfullyDeleted'));
                    });
            }
        });
    }

    copyToClipboard(text) {
        this.clipboardService.copyFromContent(text);
        abp.notify.info(this.l('SavedToClipboard'));
    }

    showTooltip() {
        this.toggleTooltip = true;
    }

    getMaskedKey(key: string) {
        let parts = key.split('-'), last = parts.pop();
        return parts.map(part => part.replace(/.?/igm, 'X')).join('-') + '-' + last;
    }

    ngOnDestroy() {
        this.getRootComponent().overflowHidden();
    }
}

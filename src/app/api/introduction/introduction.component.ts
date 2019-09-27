/** Core imports */
import { Component, OnInit, OnDestroy, Injector } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { ClipboardService } from 'ngx-clipboard';
import remove from 'lodash/remove';

/** Application imports */
import { AppComponentBase } from '@shared/common/app-component-base';
import { appModuleAnimation } from '@shared/animations/routerTransition';
import { ApiKeyServiceProxy, ApiKeyInfo, GenerateApiKeyInput } from '@shared/service-proxies/service-proxies';
import { EditKeyDialog } from '@app/api/introduction/add-key-dialog/add-key-dialog.component';

@Component({
    templateUrl: './introduction.component.html',
    styleUrls: ['./introduction.component.less'],
    animations: [appModuleAnimation()],
    providers: [ ApiKeyServiceProxy ]
})
export class IntroductionComponent extends AppComponentBase implements OnInit, OnDestroy {
    public headlineConfig = {
        names: [this.l('Interactive API Documentation')],
        iconSrc: './assets/common/icons/api-icon.svg',
        buttons: []
    };
    toggleTooltip = true;

    public apiKeys: ApiKeyInfo[];
    private elementForBlocking: Element;
    scrollHeight: number = window.innerHeight - 149;

    constructor(injector: Injector,
        public dialog: MatDialog,
        private apiKeyService: ApiKeyServiceProxy,
        private clipboardService: ClipboardService) {
        super(injector);
    }

    addApiKey() {
        this.dialog.open(EditKeyDialog, {})
            .afterClosed()
            .subscribe((result: GenerateApiKeyInput) => {
                if (result) {
                    this.apiKeyService.generate(result).subscribe(result => {
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
        this.apiKeyService.getAll(undefined)
            .subscribe((apiKeys) => {
                abp.ui.clearBusy(this.elementForBlocking);

                this.apiKeys = apiKeys && apiKeys.length ? apiKeys : null;
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
        abp.notify.info(this.l('Copied'));
    }

    showTooltip() {
        this.toggleTooltip = true;
    }

    ngOnDestroy() {
        this.getRootComponent().overflowHidden();
    }
}

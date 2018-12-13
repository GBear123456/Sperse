import { Component, ElementRef, Injector, ViewChild, OnInit } from '@angular/core';
import { AppSessionService } from '@shared/common/session/app-session.service';
import { LinkToUserInput, UserLinkServiceProxy } from '@shared/service-proxies/service-proxies';
import { ModalDirective } from 'ngx-bootstrap';
import { finalize } from 'rxjs/operators';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';

@Component({
    selector: 'linkAccountModal',
    templateUrl: './link-account-modal.component.html'
})
export class LinkAccountModalComponent extends ModalDialogComponent implements OnInit {

    @ViewChild('tenancyNameInput') tenancyNameInput: ElementRef;
    @ViewChild('linkAccountModal') modal: ModalDirective;

    saving = false;
    linkUser: LinkToUserInput = new LinkToUserInput();

    constructor(
        injector: Injector,
        private _userLinkService: UserLinkServiceProxy,
        private _sessionAppService: AppSessionService
    ) {
        super(injector);
        this.linkUser = new LinkToUserInput();
        this.linkUser.tenancyName = this._sessionAppService.tenancyName;
    }

    ngOnInit() {
        super.ngOnInit();

        this.data.title = this.l('LinkedAccounts');
        this.data.editTitle = false;
        this.data.titleClearButton = false;
        this.data.placeholder = this.l('LinkedAccounts');

        this.data.buttons = [];
    }

    save(): void {
        this.saving = true;
        this._userLinkService.linkToUser(this.linkUser)
            .pipe(finalize(() => { this.saving = false; }))
            .subscribe(() => {
                this.notify.info(this.l('SavedSuccessfully'));
                this.close();
            });
    }

}

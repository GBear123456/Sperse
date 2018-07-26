import { AbpMultiTenancyService } from '@abp/multi-tenancy/abp-multi-tenancy.service';
import { Component, EventEmitter, Injector, Output, ViewChild } from '@angular/core';
import { LinkedAccountService } from '@app/shared/layout/linked-account.service';
import { AppComponentBase } from '@shared/common/app-component-base';
import { LinkedUserDto, UnlinkUserInput, UserLinkServiceProxy } from '@shared/service-proxies/service-proxies';
import { ModalDirective } from 'ngx-bootstrap';
import { LazyLoadEvent } from 'primeng/components/common/lazyloadevent';
import { Paginator } from 'primeng/paginator';
import { Table } from 'primeng/table';
import { LinkAccountModalComponent } from './link-account-modal.component';
import { UserHelper } from '../helpers/UserHelper';

@Component({
    selector: 'linkedAccountsModal',
    templateUrl: './linked-accounts-modal.component.html'
})
export class LinkedAccountsModalComponent extends AppComponentBase {

    @ViewChild('linkedAccountsModal') modal: ModalDirective;
    @ViewChild('linkAccountModal') linkAccountModal: LinkAccountModalComponent;
    @ViewChild('dataTable') dataTable: Table;
    @ViewChild('paginator') paginator: Paginator;

    @Output() modalClose: EventEmitter<any> = new EventEmitter<any>();

    private _$linkedAccountsTable: JQuery;

    constructor(
        injector: Injector,
        private _userLinkService: UserLinkServiceProxy,
        private _linkedAccountService: LinkedAccountService
    ) {
        super(injector);
    }

    getLinkedUsers(event?: LazyLoadEvent) {
        this.primengTableHelper.showLoadingIndicator();

        this._userLinkService.getLinkedUsers(
            this.primengTableHelper.getMaxResultCount(this.paginator, event),
            this.primengTableHelper.getSkipCount(this.paginator, event),
            this.primengTableHelper.getSorting(this.dataTable))
            .subscribe(result => {
                this.primengTableHelper.totalRecordsCount = result.totalCount;
                this.primengTableHelper.records = result.items;
                this.primengTableHelper.hideLoadingIndicator();
            });
    }

    getShownLinkedUserName(linkedUser: LinkedUserDto): string {
        return UserHelper.getShownUserName(linkedUser.username, linkedUser.tenantId, linkedUser.tenancyName);
    }

    deleteLinkedUser(linkedUser: LinkedUserDto): void {
        this.message.confirm(
            this.l('LinkedUserDeleteWarningMessage', linkedUser.username),
            isConfirmed => {
                if (isConfirmed) {
                    const unlinkUserInput = new UnlinkUserInput();
                    unlinkUserInput.userId = linkedUser.id;
                    unlinkUserInput.tenantId = linkedUser.tenantId;

                    this._userLinkService.unlinkUser(unlinkUserInput).subscribe(() => {
                        this.reloadPage();
                        this.notify.success(this.l('SuccessfullyUnlinked'));
                    });
                }
            }
        );
    }

    reloadPage(): void {
        this.paginator.changePage(this.paginator.getPage());
    }

    manageLinkedAccounts(): void {
        this.linkAccountModal.show();
    }

    switchToUser(linkedUser: LinkedUserDto): void {
        this._linkedAccountService.switchToAccount(linkedUser.id, linkedUser.tenantId);
    }

    show(): void {
        this.modal.show();
    }

    close(): void {
        this.modal.hide();
        this.modalClose.emit(null);
    }
}

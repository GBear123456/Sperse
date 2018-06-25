import { Component, ViewChild, Injector, Output, EventEmitter } from '@angular/core';
import { ModalDirective } from 'ngx-bootstrap';
import { AppComponentBase } from '@shared/common/app-component-base';
import { UserLinkServiceProxy, LinkedUserDto, UnlinkUserInput } from '@shared/service-proxies/service-proxies';
import { LinkAccountModalComponent } from './link-account-modal.component';
import { LinkedAccountService } from '@app/shared/layout/linked-account.service';
import { DataTable } from 'primeng/components/datatable/datatable';
import { Paginator } from 'primeng/components/paginator/paginator';
import { LazyLoadEvent } from 'primeng/components/common/lazyloadevent';
import { UserHelper } from '../helpers/UserHelper';

@Component({
    selector: 'linkedAccountsModal',
    templateUrl: './linked-accounts-modal.component.html'
})
export class LinkedAccountsModalComponent extends AppComponentBase {

    @ViewChild('linkedAccountsModal') modal: ModalDirective;
    @ViewChild('linkAccountModal') linkAccountModal: LinkAccountModalComponent;
    @ViewChild('dataTable') dataTable: DataTable;
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
        this.primengDatatableHelper.showLoadingIndicator();

        this._userLinkService.getLinkedUsers(
            this.primengDatatableHelper.getMaxResultCount(this.paginator, event),
            this.primengDatatableHelper.getSkipCount(this.paginator, event),
            this.primengDatatableHelper.getSorting(this.dataTable))
            .subscribe(result => {
                this.primengDatatableHelper.totalRecordsCount = result.totalCount;
                this.primengDatatableHelper.records = result.items;
                this.primengDatatableHelper.hideLoadingIndicator();
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

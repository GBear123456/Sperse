import { Component, EventEmitter, Injector, Output, ViewChild, OnInit } from '@angular/core';
import { LinkedAccountService } from '@app/shared/layout/linked-account.service';
import { LinkedUserDto, UnlinkUserInput, UserLinkServiceProxy } from '@shared/service-proxies/service-proxies';
import { LazyLoadEvent } from 'primeng/components/common/lazyloadevent';
import { Paginator } from 'primeng/paginator';
import { Table } from 'primeng/table';
import { LinkAccountModalComponent } from './link-account-modal.component';
import { UserHelper } from '../helpers/UserHelper';
import { MatDialog } from '@angular/material/dialog';
import { AppModalDialogComponent } from '@app/shared/common/dialogs/modal/app-modal-dialog.component';

@Component({
    selector: 'linkedAccountsModal',
    templateUrl: './linked-accounts-modal.component.html',
    styleUrls: ['./linked-accounts-modal.component.less']
})
export class LinkedAccountsModalComponent extends AppModalDialogComponent implements OnInit {
    @ViewChild('dataTable') dataTable: Table;
    @ViewChild('paginator') paginator: Paginator;
    @Output() modalClose: EventEmitter<any> = new EventEmitter<any>();

    constructor(
        injector: Injector,
        private dialog: MatDialog,
        private _userLinkService: UserLinkServiceProxy,
        private _linkedAccountService: LinkedAccountService
    ) {
        super(injector);
    }

    ngOnInit() {
        super.ngOnInit();

        this.data.title = this.l('LinkedAccounts');
        this.data.editTitle = false;
        this.data.titleClearButton = false;
        this.data.placeholder = this.l('LinkedAccounts');

        this.data.buttons = [];
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

    manageLinkedAccounts(e): void {
        let dialogRef = this.dialog.open(LinkAccountModalComponent, {
            panelClass: 'slider',
            disableClose: true,
            closeOnNavigation: false,
            data: {}
        });
        dialogRef.afterClosed().subscribe(() => {
            this.reloadPage();
        });
        if (e.stopPropagation) {
            e.stopPropagation();
        }
    }

    switchToUser(linkedUser: LinkedUserDto): void {
        this._linkedAccountService.switchToAccount(linkedUser.id, linkedUser.tenantId);
    }
}

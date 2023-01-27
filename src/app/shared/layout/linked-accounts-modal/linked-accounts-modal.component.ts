/** Core imports */
import { Component, ChangeDetectionStrategy, ChangeDetectorRef, EventEmitter, Output, ViewChild } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';
import { LazyLoadEvent } from 'primeng/api/lazyloadevent';
import { Paginator } from 'primeng/paginator';
import { Table } from 'primeng/table';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { LinkedAccountService } from '@app/shared/layout/linked-accounts-modal/linked-account.service';
import { LinkedUserDto, UnlinkUserInput, UserLinkServiceProxy } from '@shared/service-proxies/service-proxies';
import { LinkAccountModalComponent } from '../link-account-modal/link-account-modal.component';
import { UserHelper } from '../../helpers/UserHelper';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { MessageService } from 'abp-ng2-module';
import { NotifyService } from 'abp-ng2-module';
import { PrimengTableHelper } from '@shared/helpers/PrimengTableHelper';
import { ModalDialogComponent } from '@shared/common/dialogs/modal/modal-dialog.component';

@Component({
    selector: 'linkedAccountsModal',
    templateUrl: './linked-accounts-modal.component.html',
    styleUrls: [
        '../../../../assets/primeng/datatable/css/primeng.datatable.less',
        './linked-accounts-modal.component.less'
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [PrimengTableHelper]
})
export class LinkedAccountsModalComponent {
    @ViewChild(ModalDialogComponent, { static: true }) modalDialog: ModalDialogComponent;
    @ViewChild('dataTable', { static: true }) dataTable: Table;
    @ViewChild('paginator', { static: true }) paginator: Paginator;
    @Output() modalClose: EventEmitter<any> = new EventEmitter<any>();

    constructor(
        private dialog: MatDialog,
        private changeDetectorRef: ChangeDetectorRef,
        private userLinkService: UserLinkServiceProxy,
        private linkedAccountService: LinkedAccountService,
        private messageService: MessageService,
        private notifyService: NotifyService,
        public primengTableHelper: PrimengTableHelper,
        public ls: AppLocalizationService
    ) { }

    getLinkedUsers(event?: LazyLoadEvent) {
        this.modalDialog.startLoading();
        this.userLinkService.getLinkedUsers(
            this.primengTableHelper.getMaxResultCount(this.paginator, event),
            this.primengTableHelper.getSkipCount(this.paginator, event),
            this.primengTableHelper.getSorting(this.dataTable))
            .pipe(finalize(() => this.modalDialog.finishLoading()))
            .subscribe(result => {
                this.primengTableHelper.totalRecordsCount = result.totalCount;
                this.primengTableHelper.records = result.items;
                this.changeDetectorRef.markForCheck();
            });
    }

    getShownLinkedUserName(linkedUser: LinkedUserDto): string {
        return UserHelper.getShownUserName(linkedUser.username, linkedUser.tenantId, linkedUser.tenancyName);
    }

    deleteLinkedUser(linkedUser: LinkedUserDto): void {
        this.messageService.confirm(
            this.ls.l('LinkedUserDeleteWarningMessage', linkedUser.username), '',
            isConfirmed => {
                if (isConfirmed) {
                    this.modalDialog.startLoading();
                    const unlinkUserInput = new UnlinkUserInput();
                    unlinkUserInput.userId = linkedUser.id;
                    unlinkUserInput.tenantId = linkedUser.tenantId;
                    this.userLinkService.unlinkUser(unlinkUserInput)
                        .pipe(finalize(() => this.modalDialog.startLoading()))
                        .subscribe(() => {
                            this.reloadPage();
                            this.notifyService.success(this.ls.l('SuccessfullyUnlinked'));
                        });
                }
            }
        );
    }

    reloadPage(): void {
        if (this.paginator.totalRecords) {
            this.paginator.changePage(this.paginator.getPage());
        } else {
            this.dataTable.reset();
        }
        this.changeDetectorRef.markForCheck();
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
        this.linkedAccountService.switchToAccount(linkedUser.id, linkedUser.tenantId);
    }
}

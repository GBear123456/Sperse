import { Component, OnInit, ViewChild, Injector, AfterViewInit, Output, EventEmitter } from '@angular/core';
import { ModalDirective } from 'ng2-bootstrap';
import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { JTableHelper } from '@shared/helpers/JTableHelper';

import { UserLinkServiceProxy, LinkedUserDto, UnlinkUserInput } from '@shared/service-proxies/service-proxies';
import { LinkAccountModalComponent } from './link-account-modal.component';
import { AbpMultiTenancyService } from '@abp/multi-tenancy/abp-multi-tenancy.service';
import { LinkedAccountService } from '@app/shared/layout/linked-account.service';

import * as moment from "moment";

@Component({
    selector: 'linkedAccountsModal',
    templateUrl: './linked-accounts-modal.component.html'
})
export class LinkedAccountsModalComponent extends AppComponentBase implements AfterViewInit {

    @ViewChild('linkedAccountsModal') modal: ModalDirective;
    @ViewChild('linkAccountModal') linkAccountModal: LinkAccountModalComponent;

    @Output() modalClose: EventEmitter<any> = new EventEmitter<any>();

    private _$linkedAccountsTable: JQuery;

    constructor(
        injector: Injector,
        private abpMultiTenancyService: AbpMultiTenancyService,
        private _userLinkService: UserLinkServiceProxy,
        private _linkedAccountService: LinkedAccountService
    ) {
        super(injector);
    }

    ngAfterViewInit(): void {
        this._$linkedAccountsTable = $('#LinkedAccountsTable');

        this._$linkedAccountsTable.jtable({
            paging: true,

            actions: {
                listAction: (postData, jtParams: JTableParams) => {
                    return JTableHelper.toJTableListAction(this._userLinkService.getLinkedUsers(jtParams.jtPageSize, jtParams.jtStartIndex, jtParams.jtSorting));
                }
            },

            fields: {
                id: {
                    key: true,
                    list: false
                },
                actions: {
                    title: this.l('Actions'),
                    width: '20%',
                    display: (data: JTableFieldOptionDisplayData<LinkedUserDto>) => {
                        var $div = $('<div></div>');

                        $('<button class="btn btn-xs btn-primary blue"><i class="icon-login"></i>' + this.l('LogIn') + '</button>')
                            .appendTo($div)
                            .click(() => {
                                this.switchToUser(data.record);
                            });

                        return $div;

                    }
                },
                userName: {
                    title: this.l('UserName'),
                    width: '70%',
                    display: (data: JTableFieldOptionDisplayData<LinkedUserDto>) => {
                        var $div = $('<div></div>');
                        $('<span>' + this.getShownLinkedUserName(data.record) + '</span>').appendTo($div);
                        return $div;
                    }
                },
                unlink: {
                    title: this.l('Delete'),
                    width: '10%',
                    display: (data: JTableFieldOptionDisplayData<LinkedUserDto>) => {
                        var $div = $('<span></span>');

                        $('<button class="btn btn-xs btn-danger red"><i class="icon-trash"></i></button>')
                            .appendTo($div)
                            .click(() => {
                                this.deleteLinkedUser(data.record);
                            });

                        return $div;
                    }
                }
            }
        });
    }

    getShownLinkedUserName(linkedUser: LinkedUserDto): string {
        if (!this.abpMultiTenancyService.isEnabled) {
            return linkedUser.username;
        }

        return (linkedUser.tenantId ? linkedUser.tenancyName : ".") + "\\" + linkedUser.username;
    }

    deleteLinkedUser(linkedUser: LinkedUserDto): void {
        this.message.confirm(
            this.l('LinkedUserDeleteWarningMessage', linkedUser.username),
            isConfirmed => {
                if (isConfirmed) {
                    let unlinkUserInput = new UnlinkUserInput();
                    unlinkUserInput.userId = linkedUser.id;
                    unlinkUserInput.tenantId = linkedUser.tenantId;

                    this._userLinkService.unlinkUser(unlinkUserInput).subscribe(() => {
                        this.getLinkedUsers();
                        this.notify.success(this.l('SuccessfullyUnlinked'));
                    });
                }
            }
        );
    }

    getLinkedUsers(): void {
        this._$linkedAccountsTable.jtable('load');
    }

    manageLinkedAccounts(): void {
        this.linkAccountModal.show();
    }

    switchToUser(linkedUser: LinkedUserDto): void {
        this._linkedAccountService.switchToAccount(linkedUser.id, linkedUser.tenantId);
    }

    show(): void {
        this.modal.show();
        this.getLinkedUsers();
    }

    close(): void {
        this.modal.hide();
        this.modalClose.emit(null);
    }
}
/** Core imports */
import { Component, OnDestroy, ViewChild } from '@angular/core';

/** Third party imports */
import { DxListComponent } from 'devextreme-angular/ui/list';
import DataSource from 'devextreme/data/data_source';
import { MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { ProfileService } from '@shared/common/profile-service/profile.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { ContactServiceProxy, ContactCommunicationServiceProxy, CommunicationEmailStatus } from '@shared/service-proxies/service-proxies';
import { EmailTemplateDialogComponent } from '@app/crm/shared/email-template-dialog/email-template-dialog.component';
import { AppPermissions } from '@shared/AppPermissions';
import { ContactsService } from '../contacts.service';

@Component({
    selector: 'user-inbox',
    templateUrl: './user-inbox.component.html',
    styleUrls: ['./user-inbox.component.less']
})
export class UserInboxComponent implements OnDestroy {
    @ViewChild(DxListComponent, { static: true }) listComponent: DxListComponent;

    activeEmail;
    contactId: number;
    contentToolbar = [];
    dataSource: DataSource;
    noPhotoUrl = AppConsts.imageUrls.noPhoto;
    formatting = AppConsts.formatting;
    status: CommunicationEmailStatus;
    isSendSmsAndEmailAllowed = false;
    userTimezone = '0000';

    constructor(
        private loadingService: LoadingService,
        private communicationService: ContactCommunicationServiceProxy,
        private contactsService: ContactsService,
        public dialog: MatDialog,
        public ls: AppLocalizationService,
        public profileService: ProfileService
    ) {
        contactsService.contactInfoSubscribe(res => {
            this.contactId = res.id;
            this.isSendSmsAndEmailAllowed = this.contactsService.checkCGPermission(
                res.groupId, 'ViewCommunicationHistory.SendSMSAndEmail');
            this.initDataSource();
        }, this.constructor.name);
    }

    initMainToolbar() {
        setTimeout(() => {
            let visibleCount = this.getVisibleList().length;
            this.contactsService.toolbarUpdate({ customToolbar: [{
                location: 'before',
                items: [{
                    widget: 'dxSelectBox',
                    options: {
                        value: this.ls.l('Outbox'),
                        dataSource: [this.ls.l('Outbox'), this.ls.l('Inbox')],
                        inputAttr: {view: 'headline'}
                    }
                }]
            }, {
                location: 'after',
                items: [{
                    widget: 'dxTextBox',
                    options: {
                        value: '1 - ' + visibleCount + ' of ' + this.dataSource.totalCount(),
                        inputAttr: {view: 'headline'},
                        visible: visibleCount,
                        readOnly: true
                    }
                }]
            }, {
                location: 'after',
                items: [{
                    widget: 'dxButton',
                    options: {
                        text: '+ ' + this.ls.l('NewEmail')
                    },
                    visible: this.isSendSmsAndEmailAllowed,
                    action: () => this.showNewEmailDialog()
                }]
            }]});
        });
    }

    initContentToolbar() {
        this.contentToolbar = [{
            location: 'before',
            locateInMenu: 'auto',
            items: [
                {
                    name: 'archive',
                    action: Function()
                },
                {
                    name: 'status',
                    action: Function()
                },
                {
                    name: 'delete',
                    action: Function()
                }
            ]
        }, {
            location: 'after',
            locateInMenu: 'auto',
            items: [
                {
                    name: 'prev',
                    action: this.moveSelectedItem.bind(this, -1),
                    disabled: this.isActiveFirstItem()
                },
                {
                    name: 'next',
                    action: this.moveSelectedItem.bind(this, 1),
                    disabled: this.isActiveLastItem()
                }
            ]
        }, {
            location: 'after',
            locateInMenu: 'auto',
            items: [
                {
                    name: 'reply',
                    action: this.reply.bind(this)
                },
                {
                    name: 'replyToAll',
                    action: this.replyToAll.bind(this)
                },
                {
                    name: 'forward',
                    action: this.forward.bind(this)
                }
            ]
        }];
    }

    initDataSource() {
        this.dataSource = new DataSource({
            key: 'id',
            load: (loadOptions) => {
                if (loadOptions.take) {
                    this.loadingService.startLoading();
                    return this.communicationService.getEmails(
                        this.contactId,
                        undefined /* filter by user maybe add later */,
                        loadOptions.searchValue || undefined,
                        this.status,
                        (loadOptions.sort || []).map((item) => {
                            return item.selector + ' ' + (item.desc ? 'DESC' : 'ASC');
                        }).join(','), loadOptions.take, loadOptions.skip
                    ).toPromise().then(response => {
                        this.initMainToolbar();
                        if (this.activeEmail)
                            this.loadingService.finishLoading();
                        else
                            this.initActiveEmail(response.items[0]);
                        return {
                            data: response.items,
                            totalCount: response.totalCount
                        };
                    });
                }
            }
        });
    }

    initActiveEmail(record) {
        if (record) {
            this.loadingService.startLoading();
            this.communicationService.getEmail(record.id, this.contactId).pipe(
                finalize(() => this.loadingService.finishLoading())
            ).subscribe(res => {
                this.activeEmail = res;
                this.activeEmail.from = record.fromUserName;
                this.initContentToolbar();
            });
            return true;
        }
    }

    invalidate() {
        if (this.listComponent && this.listComponent.instance)
            this.listComponent.instance.reload();
        this.dialog.closeAll();
    }

    isActiveFirstItem(): boolean {
        return this.activeEmail && this.activeEmail.id == this.getVisibleList()[0].id;
    }

    isActiveLastItem(): boolean {
        let visibleItems = this.getVisibleList();
        return this.activeEmail && this.activeEmail.id == visibleItems[visibleItems.length - 1].id;
    }

    moveSelectedItem(shift) {
        let visibleList = this.getVisibleList();
        if (this.activeEmail)
            visibleList.some((item, index) => {
                if (item.id == this.activeEmail.id)
                    return this.initActiveEmail(visibleList[index + shift]);
            });
        else
            this.initActiveEmail(visibleList[0]);
    }

    getVisibleList() {
        return this.listComponent && this.listComponent.instance ?
            this.listComponent.instance.option('items') : [];
    }

    reply() {
        this.showNewEmailDialog('Reply', this.activeEmail);
    }

    forward() {
        this.showNewEmailDialog('Forward', this.activeEmail);
    }

    replyToAll() {
        this.showNewEmailDialog('ReplyToAll', this.activeEmail);
    }

    showNewEmailDialog(title = 'NewEmail', data = {}) {
        data['contactId'] = this.contactId;
        data['switchTemplate'] = true;
        this.contactsService.showEmailDialog(data, title)
            .subscribe(error => error || this.invalidate());
    }

    ngOnDestroy() {
        this.contactsService.toolbarUpdate();
        this.contactsService.unsubscribe(this.constructor.name);
    }
}
/** Core imports */
import { Component, OnDestroy, ViewChild } from '@angular/core';

/** Third party imports */
import { DxListComponent } from 'devextreme-angular/ui/list';
import DataSource from 'devextreme/data/data_source';
import { MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';
import { forkJoin } from 'rxjs';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { NotifyService } from '@abp/notify/notify.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { ProfileService } from '@shared/common/profile-service/profile.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { CommunicationMessageDeliveryType, ContactCommunicationServiceProxy,
    CommunicationMessageStatus, MessageDto, ContactInfoDto } from '@shared/service-proxies/service-proxies';
import { ContactsService } from '../contacts.service';

@Component({
    selector: 'user-inbox',
    templateUrl: './user-inbox.component.html',
    styleUrls: ['./user-inbox.component.less']
})
export class UserInboxComponent implements OnDestroy {
    @ViewChild(DxListComponent, { static: false }) listComponent: DxListComponent;

    contentToolbar = [];
    contactId: number;
    dataSource: DataSource;
    activeMessage: MessageDto;
    instantMessageText: string;
    instantMessageAttachments = [];
    contactInfo: ContactInfoDto;
    formatting = AppConsts.formatting;
    status: CommunicationMessageStatus;
    noPhotoUrl = AppConsts.imageUrls.noPhoto;
    statuses = Object.keys(CommunicationMessageStatus).map(item => {
        return {
            id: CommunicationMessageStatus[item],
            name: this.ls.l(item)
        };
    });
    isSendSmsAndEmailAllowed = false;
    deliveryType: CommunicationMessageDeliveryType;
    deliveryTypes = Object.keys(CommunicationMessageDeliveryType).map(item => {
        return {
            id: CommunicationMessageDeliveryType[item],
            name: this.ls.l(item)
        };
    });
    userTimezone = '0000';

    constructor(
        private loadingService: LoadingService,
        private communicationService: ContactCommunicationServiceProxy,
        private contactsService: ContactsService,
        private notifyService: NotifyService,
        public dialog: MatDialog,
        public ls: AppLocalizationService,
        public profileService: ProfileService
    ) {
        contactsService.invalidateSubscribe(
            () => this.invalidate(), this.constructor.name
        );
        contactsService.contactInfoSubscribe(res => {
            this.contactInfo = res;
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
                        valueExpr: 'id',
                        displayExpr: 'name',
                        showClearButton: true,
                        value: this.deliveryType,
                        placeholder: this.ls.l('Type'),
                        dataSource: this.deliveryTypes,
                        onValueChanged: event => {
                            this.activeMessage = undefined;
                            this.deliveryType = event.value || undefined;
                            this.dataSource.reload();
                        },
                        inputAttr: {view: 'headline'}
                    }
                }, {
                    widget: 'dxSelectBox',
                    options: {
                        valueExpr: 'id',
                        displayExpr: 'name',
                        value: this.status,
                        showClearButton: true,
                        placeholder: this.ls.l('Status'),
                        dataSource: this.statuses,
                        onValueChanged: event => {
                            this.activeMessage = undefined;
                            this.status = event.value || undefined;
                            this.dataSource.reload();
                        },
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
        let isEmail = this.activeMessage.deliveryType == CommunicationMessageDeliveryType.Email;
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
                    visible: isEmail,
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
                    visible: isEmail,
                    action: this.reply.bind(this)
                },
                {
                    name: 'replyToAll',
                    visible: isEmail,
                    action: this.replyToAll.bind(this)
                },
                {
                    name: 'forward',
                    visible: isEmail,
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
                    return this.communicationService.getMessages(
                        this.contactId,
                        undefined, /* filter by parent */
                        undefined, /* filter by user maybe add later */
                        loadOptions.searchValue || undefined,
                        this.deliveryType || undefined,
                        this.status,
                        (loadOptions.sort || []).map((item) => {
                            return item.selector + ' ' + (item.desc ? 'DESC' : 'ASC');
                        }).join(','), loadOptions.take, loadOptions.skip
                    ).toPromise().then(response => {
                        this.initMainToolbar();
                        if (this.activeMessage || !this.initActiveMessage(response.items[0]))
                            this.loadingService.finishLoading();
                        return {
                            data: response.items,
                            totalCount: response.totalCount
                        };
                    });
                }
            }
        });
    }

    initActiveMessage(record, event?) {
        if (event)
            event.stopPropagation();
        if (record && !this.activeMessage || record.id != this.activeMessage.id) {
            if (record.message)
                this.activeMessage = record.message;
            else {
                this.loadingService.startLoading();
                forkJoin(
                    this.communicationService.getMessage(record.id, this.contactId),
                    this.communicationService.getMessages(this.contactId,
                        record.id, undefined, undefined, undefined,
                        undefined, undefined, undefined, undefined)
                ).pipe(
                    finalize(() => this.loadingService.finishLoading())
                ).subscribe(([message, children]) => {
                    message['items'] = record.items = children.items;
                    record.message = this.activeMessage = message;
                    this.listComponent.instance.repaint();
                    this.initContentToolbar();
                });
            }
            return true;
        }
    }

    invalidate() {
        if (this.listComponent && this.listComponent.instance)
            this.listComponent.instance.reload();
        this.dialog.closeAll();
    }

    isActiveFirstItem(): boolean {
        return this.activeMessage && this.activeMessage.id == this.getVisibleList()[0].id;
    }

    isActiveLastItem(): boolean {
        let visibleItems = this.getVisibleList();
        return this.activeMessage && this.activeMessage.id == visibleItems[visibleItems.length - 1].id;
    }

    moveSelectedItem(shift) {
        let visibleList = this.getVisibleList();
        if (this.activeMessage)
            visibleList.some((item, index) => {
                if (item.id == this.activeMessage.id)
                    return this.initActiveMessage(visibleList[index + shift]);
            });
        else
            this.initActiveMessage(visibleList[0]);
    }

    getVisibleList() {
        return this.listComponent && this.listComponent.instance ?
            this.listComponent.instance.option('items') : [];
    }

    reply() {
        this.showNewEmailDialog('Reply', this.activeMessage);
    }

    forward() {
        this.showNewEmailDialog('Forward', this.activeMessage);
    }

    replyToAll() {
        this.showNewEmailDialog('ReplyToAll', this.activeMessage);
    }

    showNewEmailDialog(title = 'NewEmail', data = {}) {
        data['contactId'] = this.contactId;
        data['switchTemplate'] = true;
        this.contactsService.showEmailDialog(data, title)
            .subscribe(res => isNaN(res) || setTimeout(() => this.invalidate(), 1000));
    }

    openAttachment(attachment) {
        this.loadingService.startLoading();
        this.communicationService.getAttachmentLink(attachment.id).pipe(
            finalize(() => this.loadingService.finishLoading())
        ).subscribe(res => window.open(res, '_blank'));
    }

    extendMessage() {
        if (this.activeMessage.deliveryType == CommunicationMessageDeliveryType.Email)
            this.showNewEmailDialog(undefined, {
                parentId: this.activeMessage.parentId,
                subject: this.activeMessage.subject,
                body: this.instantMessageText,
                to: this.activeMessage.to['join'] ?
                    this.activeMessage.to : [this.activeMessage.to]
            });
        else
            this.contactsService.showSMSDialog({
                parentId: this.activeMessage.parentId,
                body: this.instantMessageText,
                phoneNumber: this.activeMessage.to,
                contact: this.contactInfo
            });
    }

    instantMessageSend(event) {
        if (!this.instantMessageText)
            return;

        if (this.activeMessage.deliveryType == CommunicationMessageDeliveryType.Email)
            this.contactsService.sendEmail({
                contactId: this.contactId,
                parentId: this.activeMessage.id,
                to: [this.activeMessage.to],
                replyTo: undefined,
                cc: undefined,
                bcc: undefined,
                subject: 'Re: ' + this.activeMessage.subject,
                body: this.instantMessageText,
                attachments: this.instantMessageAttachments
            }).subscribe(res => {
                if (!isNaN(res)) {
                    this.instantMessageText = '';
                    this.notifyService.success(this.ls.l('MailSent'));
                }
            });
        else
            this.contactsService.sendSMS({
                contactId: this.contactId,
                parentId: this.activeMessage.id,
                message: this.instantMessageText,
                phoneNumber: this.activeMessage.to
            }).subscribe(res => {
                if (!isNaN(res)) {
                    this.instantMessageText = '';
                    this.notifyService.success(this.ls.l('MessageSuccessfullySent'));
                }
            });
    }

    ngOnDestroy() {
        this.contactsService.toolbarUpdate();
        this.contactsService.unsubscribe(this.constructor.name);
    }
}
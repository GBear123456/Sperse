/** Core imports */
import { Component, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

/** Third party imports */
import { Observable, of, forkJoin, Subscription } from 'rxjs';
import { DxListComponent } from 'devextreme-angular/ui/list';
import { DxButtonGroupComponent } from 'devextreme-angular/ui/button-group';
import DataSource from 'devextreme/data/data_source';
import { MatDialog } from '@angular/material/dialog';
import { NgxFileDropEntry } from 'ngx-file-drop';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { NotifyService } from '@abp/notify/notify.service';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { ProfileService } from '@shared/common/profile-service/profile.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { CommunicationMessageDeliveryType, ContactCommunicationServiceProxy, AttachmentDto,
    CommunicationMessageStatus, MessageDto, ContactInfoDto } from '@shared/service-proxies/service-proxies';
import { ContactsService } from '../contacts.service';
import { AppPermissionService } from '@shared/common/auth/permission.service';

class Message extends MessageDto {
    items: MessageDto[];
    loaded: boolean;
}

class EmailAttachment extends AttachmentDto {
    progress!: number;
    loader!: Subscription;
    url!: SafeResourceUrl;
}

@Component({
    selector: 'user-inbox',
    templateUrl: './user-inbox.component.html',
    styleUrls: ['./user-inbox.component.less']
})
export class UserInboxComponent implements OnDestroy {
    @ViewChild(DxListComponent, { static: false }) listComponent: DxListComponent;
    @ViewChild(DxButtonGroupComponent, { static: false }) buttonGroupComponent: DxButtonGroupComponent;
    @ViewChild('contentView', { static: false }) contentView: ElementRef;

    contactId: number;
    contentToolbar = [];
    dataSource: DataSource;
    activeMessage: Partial<Message>;
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
    deliveryType = CommunicationMessageDeliveryType.Email;
    deliveryTypes = Object.keys(CommunicationMessageDeliveryType).map(item => {
        return {
            id: CommunicationMessageDeliveryType[item],
            name: this.ls.l(item),
            hint: this.ls.l(item),
            text: this.ls.l(item),
            icon: this.ls.l(item) === 'Email' ? 'fa fa-envelope-o' : 'fa fa-commenting-o'
        };
    });
    userTimezone = '0000';
    private readonly ident = 'UserInbox';

    constructor(
        private domSanitizer: DomSanitizer,
        private loadingService: LoadingService,
        private communicationService: ContactCommunicationServiceProxy,
        private contactsService: ContactsService,
        private notifyService: NotifyService,
        private permission: AppPermissionService,
        public dialog: MatDialog,
        public ls: AppLocalizationService,
        public profileService: ProfileService
    ) {
        contactsService.invalidateSubscribe(
            () => this.invalidate(), this.ident
        );
        contactsService.contactInfoSubscribe(res => {
            let contactId = this.contactId;
            this.contactInfo = res;
            this.contactId = res.id;
            this.isSendSmsAndEmailAllowed = this.permission.checkCGPermission(
                res.groupId, 'ViewCommunicationHistory.SendSMSAndEmail');
            if (!this.dataSource || contactId != this.contactId)
                this.initDataSource();
            else
                this.initMainToolbar();
        }, this.ident);
    }

    initMainToolbar() {
        setTimeout(() => {
            let visibleCount = this.getVisibleList().length,
                isEmail = this.deliveryType == CommunicationMessageDeliveryType.Email;
            this.contactsService.toolbarUpdate({ customToolbar: [{
                location: 'before',
                items: [{
                    widget: 'dxButtonGroup',
                    options: {
                        keyExpr: 'id',
                        elementAttr: {
                            class: 'inbox'
                        },
                        items: this.deliveryTypes,
                        selectionMode: 'multiple',
                        stylingMode: 'text',
                        focusStateEnabled: false,
                        width: '240px',
                        selectedItemKeys: this.deliveryType ? this.deliveryType : [CommunicationMessageDeliveryType.Email, CommunicationMessageDeliveryType.SMS],
                        onSelectionChanged: event => {
                            if (event.addedItems.length || event.removedItems.lenght)
                                this.activeMessage = undefined;
                                this.dataSource.reload();
                        },
                        onOptionChanged: event => {
                            this.deliveryType = event.value.length > 1 ? undefined : event.value;
                        }
                    }
                }, {
                    widget: 'dxSelectBox',
                    options: {
                        width: '180px',
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
                    visible: this.isSendSmsAndEmailAllowed && (!this.deliveryType || isEmail),
                    action: () => this.showNewEmailDialog()
                }, {
                    widget: 'dxButton',
                    options: {
                        text: '+ ' + this.ls.l('NewSms')
                    },
                    visible: this.isSendSmsAndEmailAllowed && (!this.deliveryType || !isEmail),
                    action: () => this.showNewSMSDialog()
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
                        let record;
                        this.initMainToolbar();
                        if (this.activeMessage) {
                            let lookupId = this.activeMessage.parentId || this.activeMessage.id;
                            response.items.some(item => (record = item).id == lookupId);
                        } else
                            record = response && response.items[0];
                        this.loadingService.finishLoading();
                        this.initActiveMessage(record);
                        return {
                            data: response.items,
                            totalCount: response.totalCount
                        };
                    });
                }
            }
        });
    }

    expandGroup(item) {
        item.expanded = !item.expanded;
        this.initActiveMessage(item);
    }

    initActiveMessage(record) {
        if (record && (!this.activeMessage || record.id != this.activeMessage.id || (record.hasChildren && !record.items))) {
            if (record.message && (!record.hasChildren || record.items)) {
                this.setActiveMessage(record, record.message);
            } else {
                this.loadingService.startLoading(this.contentView.nativeElement);
                forkJoin(
                    this.communicationService.getMessage(record.id, this.contactId),
                    record.hasChildren ? this.communicationService.getMessages(this.contactId, record.id,
                        undefined, undefined, undefined, undefined, undefined, undefined, undefined) : of({items: null})
                ).pipe(
                    finalize(() => this.loadingService.finishLoading(this.contentView.nativeElement))
                ).subscribe(([message, children]) => {
                    this.setActiveMessage(record, message, children);
                });
            }
            return true;
        }
    }

    setActiveMessage(record, message, children?) {
        let component = this.listComponent && this.listComponent.instance;
        if (component) {
            this.activeMessage = record.message = message;
            if (record.hasChildren && children && children.items) {
                record.items = children.items;
                if (message.deliveryType == CommunicationMessageDeliveryType.Email)
                    this.loadOneMoreChild(record);
                else
                    message.items = children.items.reverse();
                if (record.expanded == undefined)
                    record.expanded = true;
                component.repaint();
                this.getVisibleList().forEach((item, index) =>
                    component[(item.expanded ? 'expand' : 'collapse') + 'Group'](index)
                );
            }
            this.initContentToolbar();
        }
    }

    onContentReady(event) {
        if (this.activeMessage) {
            let index = 0;
            this.getVisibleList().some(item => {
                if (item.id == this.activeMessage.id)
                    return true;
                if (item.hasChildren && item.expanded) {
                    index += item.items.length;
                } else
                    index++;
            }),
            event.component.scrollTo(65 * index);
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

    showNewEmailDialog(title = 'NewEmail', data: any = {}) {
        data = Object.assign({
            switchTemplate: true,
            contactId: this.contactId
        }, data);
        this.contactsService.showEmailDialog(Object.assign(data, {
            to: data.to ? (data.to['join'] ? data.to : [data.to]) : []
        }), title).subscribe(res => isNaN(res) ||
            setTimeout(() => this.invalidate(), 1000)
        );
    }

    showNewSMSDialog() {
        this.contactsService.showSMSDialog({
            contact: this.contactInfo
        });
    }

    openAttachment(attachment) {
        this.loadingService.startLoading();
        this.communicationService.getAttachmentLink(attachment.id).pipe(
            finalize(() => this.loadingService.finishLoading())
        ).subscribe(res => window.open(res, '_blank'));
    }

    extendMessage() {
        let parentId = this.activeMessage.parentId || this.activeMessage.id;
        if (this.activeMessage.deliveryType == CommunicationMessageDeliveryType.Email)
            this.showNewEmailDialog(undefined, {
                parentId: parentId,
                subject: 'Re: ' + this.activeMessage.subject,
                body: this.instantMessageText,
                to: this.activeMessage.to['join'] ?
                    this.activeMessage.to : [this.activeMessage.to]
            });
        else
            this.contactsService.showSMSDialog({
                parentId: parentId,
                body: this.instantMessageText,
                phoneNumber: this.activeMessage.to,
                contact: this.contactInfo
            });
    }

    instantMessageSend() {
        if (!this.instantMessageText)
            return;

        let parentId = this.activeMessage.parentId || this.activeMessage.id,
            isEmail = this.activeMessage.deliveryType == CommunicationMessageDeliveryType.Email;

        (isEmail ? this.contactsService.sendEmail({
                contactId: this.contactId,
                parentId: parentId,
                to: [this.activeMessage.to],
                replyTo: undefined,
                cc: undefined,
                bcc: undefined,
                subject: 'Re: ' + this.activeMessage.subject,
                body: this.instantMessageText,
                attachments: this.instantMessageAttachments.map(item => item.id)
            }) : this.contactsService.sendSMS({
                contactId: this.contactId,
                parentId: parentId,
                message: this.instantMessageText,
                phoneNumber: this.activeMessage.to
            })
        ).subscribe(res => {
            if (!isNaN(res)) {
                this.invalidate();
                this.notifyService.success(this.ls.l(
                    isEmail ? 'MailSent' : 'MessageSuccessfullySent'
                ));
            }
        });
        this.instantMessageAttachments = [];
        this.instantMessageText = '';
    }

    loadChild(parent) {
        if (!this.activeMessage.items)
            this.activeMessage.items = [];
        let item = parent.items[this.activeMessage.items.length];
        if (item) {
            this.loadingService.startLoading(this.contentView.nativeElement);
            this.communicationService.getMessage(item.id, this.contactId).pipe(
                finalize(() => this.loadingService.finishLoading(this.contentView.nativeElement))
            ).subscribe(child => {
                this.activeMessage.items.unshift(child);
                this.activeMessage.loaded = this.activeMessage.items.length == parent.items.length;
            });
        } else
            this.activeMessage.loaded = true;
    }

    loadOneMoreChild(record?) {
        if (record)
            this.loadChild(record);
        else
            this.getVisibleList().some(item => {
                if (this.activeMessage.id == item.id) {
                    this.loadChild(item);
                    return true;
                }
            });
    }

    addAttachments(files: NgxFileDropEntry[]) {
        if (files.length)
            files.forEach(file => {
                if (file.fileEntry)
                    file.fileEntry['file'](this.uploadFile.bind(this));
                else
                    this.uploadFile(file);
            });
    }

    uploadFile(file) {
        if (file.size > 5 * 1024 * 1024)
            return this.notifyService.warn(this.ls.l('FilesizeLimitWarn', 5));

        let attachment: Partial<EmailAttachment> = {
            name: file.name,
            size: file.size
        };

        attachment.url = this.domSanitizer.bypassSecurityTrustResourceUrl(URL.createObjectURL(file));
        attachment.loader = this.sendAttachment(file).subscribe((res: any) => {
            if (res) {
                if (res.result)
                    attachment.id = res.result;
                else {
                    attachment.progress = res.loaded == res.total ? 0 :
                        Math.round(res.loaded / res.total * 100);
                }
            }
        }, res => {
            this.instantMessageAttachments = this.instantMessageAttachments.filter(item => item.name != file.name);
            this.notifyService.error(res.error.message);
        });
        this.instantMessageAttachments.push(attachment);
    }

    sendAttachment(file) {
        return new Observable(subscriber => {
            let xhr = new XMLHttpRequest(),
                formData = new FormData();
            formData.append('file', file);
            xhr.open('POST', AppConsts.remoteServiceBaseUrl + '/api/services/CRM/ContactCommunication/SaveAttachment');
            xhr.setRequestHeader('Authorization', 'Bearer ' + abp.auth.getToken());

            xhr.addEventListener('progress', event => {
                subscriber.next(event);
            });

            xhr.addEventListener('load', () => {
                let responce = JSON.parse(xhr.responseText);
                if (xhr.status === 200)
                    subscriber.next(responce);
                else
                    subscriber.error(responce);
                subscriber.complete();
            });
            xhr.send(formData);
        });
    }

    ngOnDestroy() {
        this.contactsService.toolbarUpdate();
        this.contactsService.unsubscribe(this.ident);
    }
}

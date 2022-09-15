/** Core imports */
import { Component, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, ParamMap, Router } from '@angular/router';

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
import { DateHelper } from '@shared/helpers/DateHelper';
import { NotifyService } from 'abp-ng2-module';
import { LoadingService } from '@shared/common/loading-service/loading.service';
import { ProfileService } from '@shared/common/profile-service/profile.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import {
    CommunicationMessageDeliveryType, ContactCommunicationServiceProxy, AttachmentDto, MessageListDto,
    CommunicationMessageSendingStatus, MessageDto, ContactInfoDto, FileInfo
} from '@shared/service-proxies/service-proxies';
import { ContactsService } from '../contacts.service';
import { AppPermissionService } from '@shared/common/auth/permission.service';
import { AppFeatures } from '@shared/AppFeatures';
import { AppSessionService } from '@shared/common/session/app-session.service';

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
    @ViewChild(DxListComponent) listComponent: DxListComponent;
    @ViewChild(DxButtonGroupComponent) buttonGroupComponent: DxButtonGroupComponent;
    @ViewChild('emailContent') emailContent: ElementRef;
    @ViewChild('contentView') contentView: ElementRef;

    contactId: number;
    isSubscribedToEmails: boolean;
    communicationPreferencePublicId: string;
    contentToolbar = [];
    dataSource: DataSource;
    activeMessage: Partial<Message>;
    isNotListedMessage: boolean = false;
    instantMessageText: string;
    instantMessageAttachments = [];
    contactInfo: ContactInfoDto;
    formatting = AppConsts.formatting;
    status: CommunicationMessageSendingStatus;
    statuses = Object.keys(CommunicationMessageSendingStatus).map(item => {
        return {
            id: CommunicationMessageSendingStatus[item],
            name: this.ls.l(item),
            hint: this.ls.l(item)
        };
    });
    get isActiveEmilType(): boolean {
        return this.activeMessage && this.activeMessage.deliveryType == CommunicationMessageDeliveryType.Email;
    }
    isSendSmsAndEmailAllowed = false;
    isInboundOutboundSMSEnabled = abp.features.isEnabled(AppFeatures.InboundOutboundSMS);
    isSMSIntegrationDisabled = abp.setting.get('Integrations:YTel:IsEnabled') == 'False';
    deliveryType: CommunicationMessageDeliveryType = CommunicationMessageDeliveryType.Email;
    deliveryTypes = Object.keys(CommunicationMessageDeliveryType).map(item => {
        return {
            id: CommunicationMessageDeliveryType[item],
            name: this.ls.l(item),
            hint: this.ls.l(item),
            text: this.ls.l(item),
            icon: this.ls.l(item) === 'Email' ? 'fa fa-envelope-o' : 'fa fa-commenting-o',
            visible: CommunicationMessageDeliveryType[item] != CommunicationMessageDeliveryType.SMS || this.isInboundOutboundSMSEnabled,
            disabled: this.isSMSIntegrationDisabled
        };
    });
    userTimezone = DateHelper.getUserTimezone();
    private readonly ident = 'UserInbox';

    constructor(
        private domSanitizer: DomSanitizer,
        private loadingService: LoadingService,
        private communicationService: ContactCommunicationServiceProxy,
        private contactsService: ContactsService,
        private notifyService: NotifyService,
        private permission: AppPermissionService,
        private router: Router,
        private activatedRoute: ActivatedRoute,
        public dialog: MatDialog,
        public ls: AppLocalizationService,
        public profileService: ProfileService,
        public appSession: AppSessionService
    ) {
        contactsService.invalidateSubscribe(
            () => this.invalidate(), this.ident
        );
        contactsService.contactInfoSubscribe((contactInfo: ContactInfoDto) => {
            if (contactInfo) {
                let contactId = this.contactId;
                this.contactInfo = contactInfo;
                this.contactId = contactInfo.id;
                this.isSubscribedToEmails = contactInfo.isSubscribedToEmails;
                this.communicationPreferencePublicId = contactInfo.communicationPreferencePublicId;
                this.isSendSmsAndEmailAllowed = this.permission.checkCGPermission(
                    contactInfo.groups, 'ViewCommunicationHistory.SendSMSAndEmail');
                this.activeMessage = undefined;
                if (!this.dataSource || contactId != this.contactId) {
                    var isSms = this.activatedRoute.snapshot.queryParamMap.get('sms');
                    if (isSms) {
                        this.deliveryType = CommunicationMessageDeliveryType.SMS;
                        this.initMainToolbar();
                    }
                    this.initDataSource();
                }
                else {
                    this.initMainToolbar();
                }
            }
        }, this.ident);
        activatedRoute.queryParamMap.pipe().subscribe((paramsMap: ParamMap) => {
            let messageId = paramsMap.get('messageId');
            let contactId = this.activatedRoute.parent.snapshot.paramMap.get('contactId');
            if (messageId && this.contactId && this.contactId.toString() == contactId && this.dataSource && this.dataSource.isLoaded()) {
                if (this.deliveryType) {
                    let isSms = this.activatedRoute.snapshot.queryParamMap.get('sms');
                    let paramDeliveryType = isSms ? CommunicationMessageDeliveryType.SMS : CommunicationMessageDeliveryType.Email;
                    if (this.deliveryType != paramDeliveryType) {
                        this.deliveryType = paramDeliveryType;
                        this.initMainToolbar();
                        this.dataSource.reload();
                        return;
                    }
                }

                this.clearQueryMessageParams();

                let record = this.dataSource.items().find(item => item.id == messageId);
                if (record)
                    this.initActiveMessage(record);
                else
                    this.showNotListedEmail(messageId);
            }
        });
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
                        selectedItemKeys: this.deliveryType ? this.deliveryType : [
                            CommunicationMessageDeliveryType.Email, 
                            this.isInboundOutboundSMSEnabled && CommunicationMessageDeliveryType.SMS
                        ].filter(Boolean),
                        onSelectionChanged: event => {
                            if (event.addedItems.length || event.removedItems.length)
                                this.activeMessage = undefined;
                            this.dataSource.reload();
                        },
                        onOptionChanged: event => {
                            this.deliveryType = event.value.length > 1 ? undefined : event.value[0];
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
                        inputAttr: { view: 'headline' }
                    }
                }]
            }, {
                location: 'before',
                items: [{
                    widget: 'dxButton',
                    options: {
                        text: this.getCommunicationPreferencesStatus(this.isSubscribedToEmails),
                        accessKey: `communication-preferences-${this.isSubscribedToEmails ? 'subscribed' : 'unsubscribed'}`
                    },
                    action: (e) => {
                        this.isSubscribedToEmails = !this.isSubscribedToEmails;
                        e.element.classList.remove(this.isSubscribedToEmails ? 'unsubscribed' : 'subscribed');
                        e.element.classList.add(this.isSubscribedToEmails ? 'subscribed' : 'unsubscribed');
                        e.element.innerHTML = e.element.innerHTML.replace(this.getCommunicationPreferencesStatus(!this.isSubscribedToEmails),
                            this.getCommunicationPreferencesStatus(this.isSubscribedToEmails))
                        this.updateEmailPreferences(this.isSubscribedToEmails).subscribe(() => {
                        })
                    }
                }]
            }, {
                location: 'after',
                items: [{
                    widget: 'dxTextBox',
                    options: {
                        value: '1 - ' + visibleCount + ' of ' + this.dataSource.totalCount(),
                        inputAttr: { view: 'headline' },
                        visible: visibleCount,
                        readOnly: true
                    }
                }]
            },
            {
                location: 'after',
                items: [
                    {
                        name: 'prev',
                        action: (e) => this.contactsService.prev.next(e),
                        disabled: this.contactsService.isPrevDisabled
                    },
                    {
                        name: 'next',
                        action: (e) => this.contactsService.next.next(e),
                        disabled: this.contactsService.isNextDisabled
                    }
                ]
            },
            {
                location: 'after',
                items: [
                    {
                        widget: 'dxButton',
                        options: {
                            text: '+ ' + this.ls.l('NewEmail')
                        },
                        visible: this.isSendSmsAndEmailAllowed && (!this.deliveryType || isEmail),
                        action: () => this.showNewEmailDialog()
                    },
                    {
                        widget: 'dxButton',
                        options: {
                            text: '+ ' + this.ls.l('NewSms')
                        },
                        disabled: this.isSMSIntegrationDisabled,
                        visible: this.isInboundOutboundSMSEnabled && 
                            this.isSendSmsAndEmailAllowed && (!this.deliveryType || !isEmail),
                        action: () => this.showNewSMSDialog()
                    }
                ]
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
                    visible: false,
                    action: Function()
                },
                {
                    name: 'status',
                    visible: false,
                    action: Function()
                },
                {
                    name: 'delete',
                    visible: false,
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
                    disabled: this.isNotListedMessage || this.isActiveFirstItem()
                },
                {
                    name: 'next',
                    action: this.moveSelectedItem.bind(this, 1),
                    disabled: this.isNotListedMessage || this.isActiveLastItem()
                }
            ]
        }, {
            location: 'after',
            locateInMenu: 'auto',
            items: [
                {
                    name: 'reply',
                    visible: this.isActiveEmilType,
                    action: () => this.reply(),
                    disabled: !this.isSendSmsAndEmailAllowed
                },
                {
                    name: 'replyToAll',
                    visible: this.isActiveEmilType,
                    action: () => this.reply(true),
                    disabled: !this.isSendSmsAndEmailAllowed || !this.activeMessage || !this.activeMessage.cc
                },
                {
                    name: 'forward',
                    visible: this.isActiveEmilType,
                    action: this.forward.bind(this),
                    disabled: !this.isSendSmsAndEmailAllowed
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
                        response.items.forEach(v => this.setMessageStatus(v));

                        let queryMessageId = this.activatedRoute.snapshot.queryParamMap.get('messageId');
                        if (queryMessageId)
                            this.clearQueryMessageParams();

                        if (queryMessageId || this.activeMessage) {
                            let lookupId = queryMessageId || this.activeMessage.parentId || this.activeMessage.id;
                            record = response.items.find(item => item.id == lookupId);
                        }
                        if (!record) {
                            if (queryMessageId) {
                                this.showNotListedEmail(queryMessageId);
                            }
                            else {
                                record = response && response.items[0];
                            }
                        }

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

    showNotListedEmail(messageId) {
        this.loadingService.startLoading(this.contentView.nativeElement);
        this.communicationService.getMessage(messageId, this.contactId).pipe(
            finalize(() => this.loadingService.finishLoading(this.contentView.nativeElement))
        ).subscribe(message => {
            let record;
            if (message.parentId)
                record = this.dataSource.items().find(item => item.id == message.parentId);

            if (record)
                this.initActiveMessage(record, message);
            else {
                this.setMessageStatus(message);
                this.activeMessage = message;
                this.isNotListedMessage = true;
                this.showEmailContent();
                this.initContentToolbar();
                this.scrollToActiveMessage();
            }
        });
    }

    expandGroup(item) {
        item.expanded = !item.expanded;
        this.initActiveMessage(item);
    }

    initActiveMessage(record, childMessage?) {
        if (record && (!this.activeMessage || record.id != this.activeMessage.id || (record.hasChildren && !record.items))) {
            if (record.message && (!record.hasChildren || record.items)) {
                this.setActiveMessage(record, record.message);
            } else {
                this.loadingService.startLoading(this.contentView.nativeElement);
                forkJoin(
                    this.communicationService.getMessage(record.id, this.contactId),
                    record.hasChildren ? this.communicationService.getMessages(this.contactId, record.id,
                        undefined, undefined, undefined, undefined, 'Id ASC', undefined, undefined) : of({ items: null })
                ).pipe(
                    finalize(() => this.loadingService.finishLoading(this.contentView.nativeElement))
                ).subscribe(([message, children]: [any, any]) => {
                    this.setMessageStatus(message);
                    if (record.hasChildren && children && children.items) {
                        children.items.forEach(v => this.setMessageStatus(v));
                        record.items = children.items;
                        message.items = children.items;
                        this.checkExpandRecord(record);
                    }

                    if (childMessage) {
                        message = childMessage;
                        record = children.items.find(
                            item => item.id == childMessage.id);
                    }

                    this.setActiveMessage(record, message);
                });
            }
            return true;
        }
    }

    setActiveMessage(record, message) {
        this.activeMessage = record.message = message;
        this.isNotListedMessage = false;
        this.checkExpandRecord(record);
        if (this.isActiveEmilType)
            this.showEmailContent();
        this.initContentToolbar();
        this.scrollToActiveMessage();
    }

    checkExpandRecord(record) {
        let component = this.listComponent && this.listComponent.instance;
        if (component && record.hasChildren) {
            if (record.expanded == undefined)
                record.expanded = true;
            component.repaint();
            this.getVisibleList().forEach((item, index) =>
                component[(item.expanded ? 'expand' : 'collapse') + 'Group'](index)
            );
        }
    }

    showEmailContent() {
        setTimeout(() => {
            if (this.activeMessage && this.emailContent) {
                let window = this.emailContent.
                    nativeElement.contentWindow;
                window.document.open();
                window.document.write(this.activeMessage.body == null
                    ? this.ls.l('EmailContentExternalMailer')
                    : this.activeMessage.body
                );
                window.document.close();
            }
        });
    }

    clearQueryMessageParams() {
        this.router.navigate([], {
            queryParams: { 'messageId': null, 'sms': null },
            queryParamsHandling: 'merge'
        })
    }

    scrollToActiveMessage() {
        if (this.activeMessage) {
            let index = 0;
            this.getVisibleList().some(item => {
                if (item.id == this.activeMessage.id)
                    return true;
                if (item.hasChildren && item.expanded) {
                    if (item.items.some(child => {
                        if (child.id == this.activeMessage.id)
                            return true;
                        index++;
                    })) return true;
                } else
                    index++;
            });
            this.listComponent.instance.scrollTo(65 * index);
        }
    }

    invalidate() {
        if (this.listComponent && this.listComponent.instance)
            this.listComponent.instance.reload();
        this.dialog.closeAll();
    }

    isActiveFirstItem(): boolean {
        let items = this.getVisibleList();
        return this.activeMessage && items[0] &&
            this.activeMessage.id == items[0].id;
    }

    isActiveLastItem(): boolean {
        let visibleItems = this.getVisibleList(),
            item = visibleItems[visibleItems.length - 1];
        return this.activeMessage && item && this.activeMessage.id == item.id;
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

    reply(forAll = false) {
        let ccList = forAll ? (this.activeMessage.cc ? this.activeMessage.cc.split(',') : []) : [];
        if (this.activeMessage.isInbound)
            ccList.push(this.activeMessage.to);
        this.showNewEmailDialog(forAll ? 'ReplyToAll' : 'Reply', {
            ...this.activeMessage,
            to: [this.activeMessage.isInbound ?
                (this.activeMessage.fromUserName || '') + ' <' + this.activeMessage.from + '>' :
                this.activeMessage.to
            ],
            cc: ccList,
            bcc: this.activeMessage.bcc ? this.activeMessage.bcc.split(',') : [],
            subject: (this.activeMessage.subject.startsWith('Re:') ? '' : 'Re: ') + this.activeMessage.subject,
            body: '<br><br><div dir="ltr">On ' +
                this.activeMessage.creationTime.format('ddd, MMM Do YYYY, h:mm:ss A') + ' ' + (this.activeMessage.fromUserName || '') +
                '&lt;<a href="' + this.activeMessage.from + '">' + this.activeMessage.from + '</a>&gt;' +
                ' wrote:<br></div><blockquote style="margin:0px 0px 0px 0.8ex;border-left:1px solid rgb(204,204,204);padding-left:1ex">' +
                this.activeMessage.body +
                '</blockquote>',
            attachments: []
        });
    }

    forward() {
        this.showNewEmailDialog('Forward', {
            ...this.activeMessage,
            to: [],
            cc: [],
            bcc: [],
            replyToId: null,
            subject: (this.activeMessage.subject.startsWith('Fwd:') ? '' : 'Fwd: ') + this.activeMessage.subject,
            body: '<br><br><div dir="ltr">---------- Forwarded message ---------<br>' +
                'From: <strong class="sendername" dir="auto">' + (this.activeMessage.fromUserName || '') + '</strong>' +
                '<span dir="auto">&lt;<a href="' + this.activeMessage.from + '">' + this.activeMessage.from + '</a>&gt;</span><br>' +
                'Date: ' + this.activeMessage.creationTime.format('ddd, MMM Do YYYY, h:mm:ss A') + '<br>' +
                'Subject: ' + this.activeMessage.subject + '<br>' +
                'To: ' + this.activeMessage.to + '<br></div><br><br>' + this.activeMessage.body
        });
    }

    showNewEmailDialog(title = 'NewEmail', data: any = {}) {
        data = Object.assign({
            contactId: this.contactId,
            replyToId: data.id
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
        if (this.isActiveEmilType)
            this.showNewEmailDialog(undefined, {
                replyToId: this.activeMessage.id,
                subject: 'Re: ' + this.activeMessage.subject,
                body: this.instantMessageText,
                to: this.activeMessage.to['join'] ?
                    this.activeMessage.to : [this.activeMessage.to]
            });
        else if (this.isInboundOutboundSMSEnabled && !this.isSMSIntegrationDisabled)
            this.contactsService.showSMSDialog({
                parentId: this.activeMessage.parentId || this.activeMessage.id,
                body: this.instantMessageText,
                phoneNumber: this.activeMessage.to,
                contact: this.contactInfo
            });
    }

    instantMessageSend() {
        if (!this.instantMessageText)
            return;

        let parentId = this.activeMessage.parentId || this.activeMessage.id;

        this.contactsService.sendSMS({
            contactId: this.contactId,
            parentId: parentId,
            message: this.instantMessageText,
            phoneNumber: this.activeMessage.isInbound ? this.activeMessage.from : this.activeMessage.to
        }).subscribe(res => {
            if (!isNaN(res)) {
                this.invalidate();
                this.notifyService.success(this.ls.l('MessageSuccessfullySent'));
            }
        });
        this.instantMessageAttachments = [];
        this.instantMessageText = '';
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

    getExtension(attachment) {
        let ext = attachment.name.split('.').pop();
        return ~['docx', 'doc', 'pdf', 'ppt', 'pptx', 'rtf', 'txt', 'xls', 'xlsx'].indexOf(ext) ? ext : '';
    }

    setMessageStatus(messageDto: MessageListDto) {
        let messageStatus;
        if (messageDto.isInbound) {
            messageStatus = this.ls.l('Inbox');
        } else {
            messageStatus = messageDto.status;
            if (messageDto.recepients && messageDto.recepients.length) {
                let recipientsCount = messageDto.deliveryType == CommunicationMessageDeliveryType.SMS ? 1 : messageDto.to.split(',').length;
                if (recipientsCount == 1) {
                    messageStatus = messageDto.recepients[0].deliveryStatus;
                }
            }
        }

        messageDto['statusCalculated'] = messageStatus;
    }

    updateEmailPreferences(isSubscribed: boolean) {
        return new Observable(subscriber => {
            let xhr = new XMLHttpRequest()
            xhr.open('GET', `${AppConsts.remoteServiceBaseUrl}/preferences/${isSubscribed ? 'subscribe' : 'unsubscribe'}/${this.appSession.tenantId == null
                ? 0 : this.appSession.tenantId}/${this.communicationPreferencePublicId}`);

            xhr.addEventListener('load', () => {
                if (xhr.status === 200)
                    subscriber.next();
                else
                    subscriber.error();
                subscriber.complete();
            });
            xhr.send();
        });
    }

    getCommunicationPreferencesStatus(isSubscribed: boolean) {
        return this.ls.l(`CommunicationPreferencesStatus_${isSubscribed ? 'Subscribed' : 'Unsubscribed'}`);
    }

    ngOnDestroy() {
        this.contactsService.toolbarUpdate();
        this.contactsService.unsubscribe(this.ident);
    }
}

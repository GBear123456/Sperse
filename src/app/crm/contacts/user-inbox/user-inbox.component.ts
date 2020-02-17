/** Core imports */
import { Injector, Component, OnDestroy, ViewChild, HostListener } from '@angular/core';

/** Third party imports */
import DataSource from 'devextreme/data/data_source';
import { MatDialog } from '@angular/material/dialog';
import { finalize } from 'rxjs/operators';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ContactServiceProxy, ContactCommunicationServiceProxy, CommunicationEmailStatus } from '@shared/service-proxies/service-proxies';
import { EmailTemplateDialogComponent } from '@app/crm/shared/email-template-dialog/email-template-dialog.component';
import { AppPermissions } from '@shared/AppPermissions';
import { ContactsService } from '../contacts.service';

@Component({
    selector: 'user-inbox',
    templateUrl: './user-inbox.component.html',
    styleUrls: ['./user-inbox.component.less']
})
export class UserInboxComponent extends AppComponentBase implements OnDestroy {
    isSendSmsAndEmailAllowed = false;

    contentToolbar = [{
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
                action: Function()
            },
            {
                name: 'next',
                action: Function()
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

    activeEmail;
    contactId: number;
    searchPhrase: string;
    dataSource: DataSource;
    formatting = AppConsts.formatting;
    status: CommunicationEmailStatus;

    constructor(injector: Injector,
        public dialog: MatDialog,
        private communicationService: ContactCommunicationServiceProxy,
        private contactsService: ContactsService
    ) {
        super(injector);

        contactsService.contactInfoSubscribe(res => {
            this.contactId = res.id;
            this.isSendSmsAndEmailAllowed = this.contactsService.checkCGPermission(
                res.groupId, 'ViewCommunicationHistory.SendSMSAndEmail');
            setTimeout(() => {
                contactsService.toolbarUpdate({ customToolbar: [{
                    location: 'before',
                    items: [{
                        widget: 'dxSelectBox',
                        options: {
                            value: this.l('Outbox'),
                            dataSource: [this.l('Outbox'), this.l('Inbox')],
                            inputAttr: {view: 'headline'},
                            onValueChanged: () => { }
                        }
                    }]
                }, {
                    location: 'after',
                    items: [{
                        widget: 'dxButton',
                        options: {
                            text: '+ ' + this.l('NewEmail')
                        },
                        visible: this.isSendSmsAndEmailAllowed,
                        action: () => this.showNewEmailDialog()
                    }]
                }]});
            });
            this.initDataSource();
        }, this.constructor.name);
    }

    initDataSource() {
        this.dataSource = new DataSource({
            key: 'id',
            load: (loadOptions) => {
                this.startLoading();
                return this.communicationService.getEmails(
                    this.contactId,
                    undefined /* filter by user maybe add later */,
                    this.searchPhrase,
                    this.status,
                    (loadOptions.sort || []).map((item) => {
                        return item.selector + ' ' + (item.desc ? 'DESC' : 'ASC');
                    }).join(','), loadOptions.take || -1, loadOptions.skip
                ).toPromise().then(response => {
                    this.initActiveEmail(response.items[0]);
                    return {
                        data: response.items,
                        totalCount: response.totalCount
                    };
                });
            }
        });
    }

    initActiveEmail(record) {
        this.startLoading();
        this.communicationService.getEmail(record.id, this.contactId).pipe(
            finalize(() => this.finishLoading())
        ).subscribe(res => {
            this.activeEmail = res;
            this.activeEmail.from = record.fromUserName;
        });
    }

    invalidate() {
        this.dataSource.reload();
        this.dialog.closeAll();
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
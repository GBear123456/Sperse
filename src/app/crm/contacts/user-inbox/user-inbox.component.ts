/** Core imports */
import { Injector, Component, OnDestroy, ViewChild, HostListener } from '@angular/core';

/** Third party imports */
import { MatDialog } from '@angular/material/dialog';

/** Application imports */
import { AppConsts } from '@shared/AppConsts';
import { AppComponentBase } from '@shared/common/app-component-base';
import { ContactServiceProxy } from '@shared/service-proxies/service-proxies';
import { EmailTemplateDialogComponent } from '@app/crm/shared/email-template-dialog/email-template-dialog.component';
import { ContactsService } from '../contacts.service';

@Component({
    selector: 'user-inbox',
    templateUrl: './user-inbox.component.html',
    styleUrls: ['./user-inbox.component.less']
})
export class UserInboxComponent extends AppComponentBase implements OnDestroy {
    emails = [{
        avatar: '',
        from: 'Test Tester',
        to: ['Some@Person.com'],
        subject: 'About important styling subject text',
        body: 'The CKEditor 5 rich text editor component for Angular can be styled using the component stylesheet or using a global stylesheet. See how to set the CKEditor 5 components height using these two approaches.',
        date: new Date()
    }];

    activeEmail = this.emails[0];

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

    contactId: Number;
    formatting = AppConsts.formatting;

    constructor(injector: Injector,
        public dialog: MatDialog,
        private contactsService: ContactsService
    ) {
        super(injector);

        contactsService.contactInfoSubscribe((res) => {
            this.contactId = res.id;
            setTimeout(() => {
                contactsService.toolbarUpdate([{
                    location: 'before',
                    items: [{
                        widget: 'dxTextBox',
                        options: {
                            value: this.l('Inbox'),
                            inputAttr: {view: 'headline'},
                            readOnly: true
                        }
                    }]        
                }, {
                    location: 'after',
                    items: [{
                        widget: 'dxButton',
                        options: {
                            text: '+ ' + this.l('NewEmail')
                        },
                        action: () => this.showNewEmailDialog()
                    }]
                }]);
            });
        }, this.constructor.name);
    }

    invalidate() {
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
        this.contactsService.showEmailDialog(data, title)
            .subscribe(error => error || this.invalidate());
    }

    ngOnDestroy() {
        this.contactsService.toolbarUpdate();
        this.contactsService.unsubscribe(this.constructor.name);
    }
}
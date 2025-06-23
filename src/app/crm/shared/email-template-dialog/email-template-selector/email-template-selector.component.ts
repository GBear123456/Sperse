<<<<<<< HEAD
  /** Core imports */
import { Component, Input, Output, EventEmitter } from '@angular/core';

/** Third party imports */
import { Observable, Subject } from 'rxjs';
import { startWith, switchMap, map } from 'rxjs/operators';

/** Application imports */
import {
    EmailTemplateServiceProxy,
    GetTemplatesResponse,
    EmailTemplateType,
    CloneEmailTemplateInput
} from '@shared/service-proxies/service-proxies';
import { ContactsService } from '@app/crm/contacts/contacts.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'email-template-selector',
    templateUrl: 'email-template-selector.component.html',
    styleUrls: [ 'email-template-selector.component.less' ],
    providers: [ EmailTemplateServiceProxy ]
})
export class EmailTemplateSelectorComponent {
    internalTemplateId: number;
    systemDefaultId = -1;

    @Input() title: string = this.ls.l("UserRegistrationEmail");
    @Input() templateType: EmailTemplateType;
    @Input() showSystemDefault: boolean = true;
    @Input() showCloneButton: boolean = false;
    @Input()
    get templateId(): number {
        return this.internalTemplateId == this.systemDefaultId ? null : this.internalTemplateId;
    }
    set templateId(value: number) {
        this.internalTemplateId = this.showSystemDefault && !value ? this.systemDefaultId : value;
    }
    @Output() templateIdChange = new EventEmitter<number>();

    _refresh: Subject<null> = new Subject<null>();
    refresh$: Observable<null> = this._refresh.asObservable();
    templates$: Observable<GetTemplatesResponse[]> = this.refresh$.pipe(
        startWith(null),
        switchMap(() => this.emailTemplateProxy.getTemplates(this.templateType)),
        map(response => {
            if (this.showSystemDefault)
                response.unshift(GetTemplatesResponse.fromJS({ name: 'System Default', id: this.systemDefaultId }));
            return response;
        })
    );
    constructor(
        private contactService: ContactsService,
        public ls: AppLocalizationService,
        private emailTemplateProxy: EmailTemplateServiceProxy
    ) {
    }

    onTemplateChanged(event) {
        let value = event.value == this.systemDefaultId ? null : event.value;
        this.templateIdChange.emit(value);
    }

    showEmailTemplateDialog(createMode: boolean = false) {
        let id = createMode ? undefined : this.internalTemplateId;
        this.contactService.showEmailTemplateSelectorDialog(id, this.templateType, this.dialogSaveCallback.bind(this));
    }

    cloneEmailTemplate() {
        this.emailTemplateProxy
            .clone(new CloneEmailTemplateInput({ id: this.templateId, emailTemplateType: this.templateType }))
            .subscribe((newTemplateId) => {
                this._refresh.next();
                this.contactService.showEmailTemplateSelectorDialog(newTemplateId, this.templateType, this.dialogSaveCallback.bind(this));
                this.internalTemplateId = newTemplateId;
            });
    }

    dialogSaveCallback(data) {
        this._refresh.next();
        this.internalTemplateId = data.templateId;
    }
=======
  /** Core imports */
import { Component, Input, Output, EventEmitter } from '@angular/core';

/** Third party imports */
import { Observable, Subject } from 'rxjs';
import { startWith, switchMap, map } from 'rxjs/operators';

/** Application imports */
import {
    EmailTemplateServiceProxy,
    GetTemplatesResponse,
    EmailTemplateType,
    CloneEmailTemplateInput
} from '@shared/service-proxies/service-proxies';
import { ContactsService } from '@app/crm/contacts/contacts.service';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'email-template-selector',
    templateUrl: 'email-template-selector.component.html',
    styleUrls: [ 'email-template-selector.component.less' ],
    providers: [ EmailTemplateServiceProxy ]
})
export class EmailTemplateSelectorComponent {
    internalTemplateId: number;
    systemDefaultId = -1;

    @Input() title: string = this.ls.l("UserRegistrationEmail");
    @Input() templateType: EmailTemplateType;
    @Input() showSystemDefault: boolean = true;
    @Input() showCloneButton: boolean = false;
    @Input()
    get templateId(): number {
        return this.internalTemplateId == this.systemDefaultId ? null : this.internalTemplateId;
    }
    set templateId(value: number) {
        this.internalTemplateId = this.showSystemDefault && !value ? this.systemDefaultId : value;
    }
    @Output() templateIdChange = new EventEmitter<number>();

    _refresh: Subject<null> = new Subject<null>();
    refresh$: Observable<null> = this._refresh.asObservable();
    templates$: Observable<GetTemplatesResponse[]> = this.refresh$.pipe(
        startWith(null),
        switchMap(() => this.emailTemplateProxy.getTemplates(this.templateType)),
        map(response => {
            if (this.showSystemDefault)
                response.unshift(GetTemplatesResponse.fromJS({ name: 'System Default', id: this.systemDefaultId }));
            return response;
        })
    );
    constructor(
        private contactService: ContactsService,
        public ls: AppLocalizationService,
        private emailTemplateProxy: EmailTemplateServiceProxy
    ) {
    }

    onTemplateChanged(event) {
        let value = event.value == this.systemDefaultId ? null : event.value;
        this.templateIdChange.emit(value);
    }

    showEmailTemplateDialog(createMode: boolean = false) {
        let id = createMode ? undefined : this.internalTemplateId;
        this.contactService.showEmailTemplateSelectorDialog(id, this.templateType, this.dialogSaveCallback.bind(this));
    }

    cloneEmailTemplate() {
        this.emailTemplateProxy
            .clone(new CloneEmailTemplateInput({ id: this.templateId, emailTemplateType: this.templateType }))
            .subscribe((newTemplateId) => {
                this._refresh.next();
                this.contactService.showEmailTemplateSelectorDialog(newTemplateId, this.templateType, this.dialogSaveCallback.bind(this));
                this.internalTemplateId = newTemplateId;
            });
    }

    dialogSaveCallback(data) {
        this._refresh.next();
        this.internalTemplateId = data.templateId;
    }
>>>>>>> f999b481882149d107812286d0979872df712626
}
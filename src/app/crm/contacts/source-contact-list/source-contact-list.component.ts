/** Core imports */
import { Component, Injector, Input, EventEmitter, Output, ViewChild, 
    ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

/** Third party imports */
import { finalize } from 'rxjs/operators';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { StaticListComponent } from '@app/shared/common/static-list/static-list.component';
import { ContactServiceProxy } from '@shared/service-proxies/service-proxies';

@Component({
  selector: 'source-contact-list',
  templateUrl: './source-contact-list.component.html',
  styleUrls: ['./source-contact-list.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ ContactServiceProxy ]
})
export class SourceContactListComponent {
    @ViewChild(StaticListComponent) sourceComponent: StaticListComponent;
    @Output() onItemSelected: EventEmitter<any> = new EventEmitter();
    @Output() onDataLoaded: EventEmitter<any> = new EventEmitter();
    @Input() targetSelector: string = '#PartnersSource';
    @Input() selectedKey: number;
    @Input() 
    set contactId(value: number) {
        if (value && this._contactId != value) {
            this._contactId = value;
            this.loadSourceContacts();
        }
    }

    contacts: any = [];
    private lookupTimeout: any;
    private _contactId: number;

    constructor(
        injector: Injector,
        public ls: AppLocalizationService,
        private changeDetectorRef: ChangeDetectorRef,
        private contactProxy: ContactServiceProxy
    ) {  }

    loadSourceContacts(searchPhrase?: string, elm?: any) {
        elm && abp.ui.setBusy(elm);
        this.contactProxy.getSourceContacts(searchPhrase, this._contactId, 10)
            .pipe(finalize(() => elm && abp.ui.clearBusy(elm)))
            .subscribe(res => {
                this.onDataLoaded.emit(this.contacts = res);
                this.changeDetectorRef.detectChanges();
            });
    }    

    onSourceFiltered(event) {
        clearTimeout(this.lookupTimeout);
        this.lookupTimeout = setTimeout(() => {
            let value = this.getInputElementValue(event);
            this.loadSourceContacts(value, this.sourceComponent.dxList.instance.element());
        }, 600);
    }    

    getInputElementValue(event) {
        return event.element.getElementsByTagName('input')[0].value;
    }

    toggle() {
        this.sourceComponent.toggle();
        this.changeDetectorRef.detectChanges();
    }
}
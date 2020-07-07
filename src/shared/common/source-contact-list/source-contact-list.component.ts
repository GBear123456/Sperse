/** Core imports */
import { Component, Input, EventEmitter, Output, ViewChild,
    ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

/** Third party imports */
import { finalize } from 'rxjs/operators';

/** Application imports */
import { FilterModel } from '@shared/filters/models/filter.model';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { StaticListComponent } from '@app/shared/common/static-list/static-list.component';
import { ContactServiceProxy, SourceContactInfo } from '@shared/service-proxies/service-proxies';
import { SourceContact } from './source-contact.interface';

@Component({
  selector: 'source-contact-list',
  templateUrl: './source-contact-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ ContactServiceProxy ]
})
export class SourceContactListComponent {
    @ViewChild(StaticListComponent, { static: true }) sourceComponent: StaticListComponent;
    @Output() onItemSelected: EventEmitter<any> = new EventEmitter();
    @Output() onDataLoaded: EventEmitter<any> = new EventEmitter();
    @Output() onApply: EventEmitter<any> = new EventEmitter();
    @Input() targetSelector = '#PartnersSource';
    @Input() selectedKeys: number[];
    @Input() bulkUpdatePermissionKey;
    @Input() filterModel: FilterModel;
    @Input() selectedKey: number;
    @Input()
    set leadId(value: number) {
        if (value && this._leadId != value) {
            this._leadId = value;
            this.loadSourceContacts();
        }
    }

    contacts: SourceContact[] = [];
    private lookupTimeout: any;
    private _leadId: number;
    private lookupSubscription: any;

    constructor(
        public ls: AppLocalizationService,
        private changeDetectorRef: ChangeDetectorRef,
        private contactProxy: ContactServiceProxy
    ) {}

    loadSourceContacts(searchPhrase?: string, elm?: any) {
        if (!this.contacts.length) {
            let dxList  = this.sourceComponent.dxList;
            if (dxList && !elm)
                elm = dxList.instance.element();
            elm && abp.ui.setBusy(elm);
            this.lookupSubscription && this.lookupSubscription.unsubscribe();
            this.lookupSubscription = this.contactProxy.getSourceContacts(searchPhrase, this._leadId, 10)
                .pipe(finalize(() => elm && abp.ui.clearBusy(elm)))
                .subscribe((contacts: SourceContactInfo[]) => {
                    this.onDataLoaded.emit(this.contacts = contacts.map(item => {
                        let person = item.personName && item.personName.trim();
                        return {
                            id: item.id,
                            name: person || item.companyName,
                            suffix: item.affiliateCode ? ' (' + item.affiliateCode + ')' : '',
                            addition: person ?
                                [item.jobTitle, item.companyName].filter(Boolean).join(' @ ') :
                                (item.companyName ? this.ls.l('Company') : '')
                        };
                    }));
                    this.changeDetectorRef.detectChanges();
                });
        }
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

    onOptionChanged(event) {
        if (event.name == 'items')
            setTimeout(() => this.sourceComponent.dxTooltip.instance.repaint());
    }

    onFilterApply(contact) {
        let filterElement = this.filterModel.items.element;
        if (filterElement['contact'] && filterElement['contact'].id == contact.id)
            filterElement['contact'] = undefined;
        else
            filterElement['contact'] = contact;
        this.toggle();
    }

    toggle() {
        if (this.sourceComponent.toggle())
            setTimeout(() => this.loadSourceContacts());
        this.changeDetectorRef.markForCheck();
    }
}
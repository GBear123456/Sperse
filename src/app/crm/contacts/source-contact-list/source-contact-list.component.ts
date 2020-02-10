/** Core imports */
import { Component, Input, EventEmitter, Output, ViewChild,
    ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

/** Third party imports */
import { finalize } from 'rxjs/operators';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { StaticListComponent } from '@app/shared/common/static-list/static-list.component';
import { ContactServiceProxy } from '@shared/service-proxies/service-proxies';
import { AdAutoLoginHostDirective } from '../../../../account/auto-login/auto-login.component';

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
    @Input() targetSelector = '#PartnersSource';
    @Input() selectedKey: number;
    @Input()
    set leadId(value: number) {
        if (value && this._leadId != value) {
            this._leadId = value;
            this.loadSourceContacts();
        }
    }

    contacts: any = [];
    private lookupTimeout: any;
    private _leadId: number;
    private lookupSubscription: any;

    constructor(
        public ls: AppLocalizationService,
        private changeDetectorRef: ChangeDetectorRef,
        private contactProxy: ContactServiceProxy
    ) {}

    loadSourceContacts(searchPhrase?: string, elm?: any) {
        let dxList  = this.sourceComponent.dxList;
        if (dxList && !elm)
            elm = dxList.instance.element();
        elm && abp.ui.setBusy(elm);
        this.lookupSubscription && this.lookupSubscription.unsubscribe();
        this.lookupSubscription = this.contactProxy.getSourceContacts(searchPhrase, this._leadId, 10)
            .pipe(finalize(() => elm && abp.ui.clearBusy(elm)))
            .subscribe(res => {
                this.onDataLoaded.emit(this.contacts = res.map(item => {
                    let person = item.personName && item.personName.trim();
                    return {
                        id: item.id,
                        name: person || item.companyName,
                        sufix: item.affiliateCode ? ' (' + item.affiliateCode + ')' : '',
                        addition: person ?
                            [item.jobTitle, item.companyName].filter(Boolean).join(' @ ') :
                            this.ls.l('Company')
                    };
                }));
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

    onOptionChanged(event) {
        if (event.name == 'items')
            setTimeout(() => this.sourceComponent.dxTooltip.instance.repaint());
    }

    toggle() {
        if (this.sourceComponent.toggle())
            this.loadSourceContacts();
        this.changeDetectorRef.detectChanges();
    }
}
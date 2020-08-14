/** Core imports */
import { Component, Input, EventEmitter, Output, ViewChild, AfterViewInit,
    OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';

/** Third party imports */
import { first, finalize, filter } from 'rxjs/operators';
import { Store, select } from '@ngrx/store';
import * as _ from 'underscore';

/** Application imports */
import { FilterModel } from '@shared/filters/models/filter.model';
import { ContactsHelper } from '@shared/crm/helpers/contacts-helper';
import { CrmStore, OrganizationUnitsStoreActions, OrganizationUnitsStoreSelectors } from '@app/crm/store';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { StaticListComponent } from '@app/shared/common/static-list/static-list.component';
import {
    ContactServiceProxy, SourceContactInfo, LeadServiceProxy,
    UpdateLeadSourceOrganizationUnitsInput, OrganizationUnitDto
} from '@shared/service-proxies/service-proxies';
import { SourceContact } from './source-contact.interface';
import { PermissionCheckerService } from '@abp/auth/permission-checker.service';
import { OrganizationUnitsTreeComponent } from '@shared/common/organization-units-tree/organization-units-tree.component';
import { ContactsService } from '@app/crm/contacts/contacts.service';
import { AppPermissions } from '@shared/AppPermissions';
import { NotifyService } from '@abp/notify/notify.service';

@Component({
  selector: 'source-contact-list',
  templateUrl: './source-contact-list.component.html',
  styleUrls: ['./source-contact-list.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ ContactServiceProxy ]
})
export class SourceContactListComponent implements AfterViewInit, OnDestroy {
    @ViewChild(StaticListComponent, { static: true }) sourceComponent: StaticListComponent;
    @ViewChild(OrganizationUnitsTreeComponent, { static: true }) orgUnitsComponent: OrganizationUnitsTreeComponent;
    @Output() onItemSelected: EventEmitter<any> = new EventEmitter();
    @Output() onDataLoaded: EventEmitter<any> = new EventEmitter();
    @Output() onOwnerFilterApply: EventEmitter<any> = new EventEmitter();
    @Output() onApply: EventEmitter<any> = new EventEmitter();
    @Input() targetSelector = '#PartnersSource';
    @Input() selectedKeys: number[];
    @Input() selectedLeads: any[];
    @Input() bulkUpdatePermissionKey;
    @Input() filterModel: FilterModel;
    @Input() filterModelOrgUnit: FilterModel;
    @Input() showOrgUnits: boolean;
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
    private ident = _.uniqueId(this.targetSelector);
    hasBulkUpdatePermission: boolean = this.permissionCheckerService.isGranted(AppPermissions.CRMBulkUpdates);
    orgUnits: OrganizationUnitDto[];
    selectedOrgUnits = [];
    showContacts = true;

    constructor(
        public ls: AppLocalizationService,
        private contactsService: ContactsService,
        private store$: Store<CrmStore.State>,
        private changeDetectorRef: ChangeDetectorRef,
        private contactProxy: ContactServiceProxy,
        private permissionCheckerService: PermissionCheckerService,
        private notifyService: NotifyService,
        private leadProxy: LeadServiceProxy
    ) {}

    ngAfterViewInit() {
        this.loadOrganizationUnits();
        this.orgUnitsComponent.organizationUnitsTree.instance.on('contentReady', () => {
            this.changeDetectorRef.detectChanges();
        });
        this.showOrgUnits && this.contactsService.orgUnitsSaveSubscribe(data => {
            if (this.selectedLeads.length && this.sourceComponent.tooltipVisible) {
                this.selectedOrgUnits = data;
            }
        }, this.ident);
    }

    loadSourceContacts(searchPhrase?: string, elm?: any) {
        if (!this.contacts.length || elm) {
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

    private loadOrganizationUnits() {
        this.store$.dispatch(new OrganizationUnitsStoreActions.LoadRequestAction(false));
        this.store$.pipe(
            select(OrganizationUnitsStoreSelectors.getOrganizationUnits),
            filter(Boolean),
            first()
        ).subscribe((orgUnits: OrganizationUnitDto[]) => {
            this.orgUnits = orgUnits;
        });
    }

    applyOrganizationUnits() {
        if (this.selectedOrgUnits && this.selectedOrgUnits.length) {
            this.toggle();
            ContactsHelper.showConfirmMessage(
                this.ls.l('UpdateForSelected', this.ls.l('Owner'), this.ls.l('Leads')), '',
            isConfirmed => {
                if (isConfirmed) {
                    abp.ui.setBusy();
                    this.leadProxy.updateSourceOrganizationUnits(new UpdateLeadSourceOrganizationUnitsInput({
                        leadIds: this.selectedLeads.map(item => item.Id),
                        sourceOrganizationUnitId: this.selectedOrgUnits[0]
                    })).pipe(
                        finalize(() => abp.ui.clearBusy())
                    ).subscribe(() => {
                        this.selectedOrgUnits = undefined;
                        this.notifyService.info(this.ls.l('SavedSuccessfully'));
                    });
                }
            }, false, this.ls.l('SourceUpdateConfirmation', 'Leads'));
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

    onContactFilterApply(contact) {
        let filterElement = this.filterModel.items.element;
        if (filterElement['contact'] && filterElement['contact'].id == contact.id)
            filterElement['contact'] = undefined;
        else
            filterElement['contact'] = contact;
        this.toggle();
    }

    onOwnerFilter(event) {
        this.onOwnerFilterApply.emit(event);
        this.toggle();
    }

    toggleContacts() {
        if (this.showContacts) {
            this.contactsService.orgUnitsUpdate({
                allOrganizationUnits: this.orgUnits,
                selectedOrgUnits: this.selectedLeads.length ? this.selectedOrgUnits :
                    [this.filterModelOrgUnit.items.element.value[0]].filter(Boolean)
            });
        }
        this.showContacts = !this.showContacts;
        setTimeout(() => {
            this.sourceComponent.dxTooltip.instance.repaint();
        });
        this.changeDetectorRef.detectChanges();
    }

    toggle() {
        this.showContacts = true;
        if (this.sourceComponent.toggle())
            setTimeout(() => this.loadSourceContacts());
        this.changeDetectorRef.markForCheck();
    }

    ngOnDestroy() {
        this.contactsService.unsubscribe(this.ident);
        this.orgUnitsComponent.organizationUnitsTree.instance.off('contentReady');
    }
}
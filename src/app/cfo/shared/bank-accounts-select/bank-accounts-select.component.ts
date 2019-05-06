import { Component, Injector, Input, Output, EventEmitter } from '@angular/core';
import { CFOComponentBase } from '@shared/cfo/cfo-component-base';
import { BankAccountsServiceProxy, BusinessEntityServiceProxy } from 'shared/service-proxies/service-proxies';
import { BankAccountsService } from '@shared/cfo/bank-accounts/helpers/bank-accounts.service';

@Component({
    selector: 'bank-accounts-select',
    templateUrl: './bank-accounts-select.component.html',
    styleUrls: ['./bank-accounts-select.component.less'],
    providers: [ BankAccountsServiceProxy, BusinessEntityServiceProxy ]
})
export class BankAccountsSelectComponent extends CFOComponentBase {
    @Input() targetBankAccountsTooltip = '';
    @Input() highlightedBankAccountIds = [];
    @Input() highlightUsedRows = false;
    @Input() showBusinessEntitiesFilter = true;
    @Input() showIsActiveFilter = true;
    @Output() onApplySelected: EventEmitter<any> = new EventEmitter();

    tooltipVisible: boolean;
    selectedBusinessEntitiesIds: any[] = [];
    businessEntities = [];
    isActive = true;
    bankAccountsService: BankAccountsService;
    constructor(
        injector: Injector,
        bankAccountsService: BankAccountsService
    ) {
        super(injector);
        this.bankAccountsService = bankAccountsService;
        bankAccountsService.businessEntities$.subscribe(
            (list) => this.businessEntities = list
        );
    }

    bankAccountsSelected() {
        /** @todo bug - situation when selected business entities changed, and then click apply (apply triggers first, then changeSelectedBusinessEntities) */
        this.bankAccountsService.applyFilter();
        this.onApplySelected.emit();
        this.tooltipVisible = false;
    }

    toggleBankAccountTooltip() {
        this.tooltipVisible = !this.tooltipVisible;
    }

    changeSelectedBusinessEntities(e) {
        const selectedBusinessEntities = e.component.option('selectedItems');
        if (this.selectedBusinessEntitiesIds) {
            const selectedBusinessEntitiesIds = selectedBusinessEntities.map(entity => entity.id);
            this.bankAccountsService.changeSelectedBusinessEntities(selectedBusinessEntitiesIds);
        }
    }

    onMultiTagPreparing(e) {
        let totalCount = this.businessEntities.length,
            selectedCount = e.selectedItems.length;
        e.text = totalCount && selectedCount ?
            (selectedCount != totalCount ? selectedCount + ' ' + this.l('of') + ' ' : '')
                + totalCount + ' ' + this.l('entities') : this.l('All_Entities');
    }

    selectAllValueChanged($event) {
        $event.component._$list.find('.dx-list-select-all-label').text(
            ($event.value ? this.l('Clear') : this.l('Select')) + ' ' + this.l('All'));
    }
}

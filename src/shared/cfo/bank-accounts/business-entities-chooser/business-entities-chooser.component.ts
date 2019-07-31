/** Core imports */
import { Component, Input, Output, EventEmitter, ViewChild } from '@angular/core';

/** Third party imports */
import { DxTreeViewComponent } from 'devextreme-angular/ui/tree-view';
import difference from 'lodash/difference';
import { first } from 'rxjs/operators';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { BankAccountsService } from '@shared/cfo/bank-accounts/helpers/bank-accounts.service';

@Component({
    selector: 'business-entities-chooser',
    templateUrl: './business-entities-chooser.component.html',
    styleUrls: ['./business-entities-chooser.component.less']
})
export class BusinessEntitiesChooserComponent {
    @ViewChild(DxTreeViewComponent) treeList: DxTreeViewComponent;

    @Input() staticItemsText;
    @Input() allSelectedTitle = false;
    @Input() popupWidth: string;

    @Output() selectionChanged: EventEmitter<any> = new EventEmitter();
    @Output() onClosed: EventEmitter<any> = new EventEmitter();

    syncAccounts  = [];
    selectedItems = [];
    selectedAll;

    constructor(
        public bankAccountsService: BankAccountsService,
        private ls: AppLocalizationService
    ) {
        bankAccountsService.syncAccounts$.pipe(first()).subscribe((res) => {
            this.syncAccounts = res;
        });
    }

    public selectedItemsChange(data) {
            this.updateSelectedList(data);
            this.selectionChanged.emit(this.getSelectedIds());
    }

    getSelectedIds() {
        return this.selectedItems.map(item => item.id);
    }

    getSelectedTitle(data) {
        if (this.staticItemsText)
            return this.staticItemsText;

        let selectedCount = this.selectedItems.length,
            totalCount = data.length;
        return selectedCount ? (this.allSelectedTitle && selectedCount == totalCount
            ? '' : this.getItemsTitle(data)) : '';
    }

    getItemsTitle(data) {
        let firstSelected = data.find(item => item.isSelected),
            moreCount = this.selectedItems.length - 1;
        return firstSelected ? firstSelected.name + (moreCount ? ' +' + moreCount : '') + ' \u25BE' : '';
    }

    updateSelectedList(data) {
        this.selectedItems = data.filter(item => item.isSelected);
        let selectedCount = this.selectedItems.length;
        this.selectedAll = selectedCount ? (selectedCount == data.length ? true : undefined) : false;
    }

    changePopupWidth(e) {
        if (this.popupWidth)
            e.component._popup.option('width', this.popupWidth);
    }

    onSelectAll(event, data) {
        if (this.treeList && typeof(event.value) == 'boolean') {
            event.value ? this.treeList.instance.selectAll()
                : this.treeList.instance.unselectAll();
            event.component.option('text', (event.value ? this.ls.l('Clear')
                : this.ls.l('Select')) + ' ' + this.ls.l('All'));
            this.updateSelectedList(data);
        }
    }

    onPopupClosed(event) {
        let selectedBankAccountIds = [];
        let businessEntitiesIds = this.getSelectedIds();
        let newBusinessEntitiesIds = difference(businessEntitiesIds,
            this.bankAccountsService.state.selectedBusinessEntitiesIds);

        this.syncAccounts.forEach(syncAccount => {
            syncAccount.bankAccounts.forEach(bankAccount => {
                if (newBusinessEntitiesIds.indexOf(bankAccount.businessEntityId) >= 0
                    || this.bankAccountsService.state.selectedBusinessEntitiesIds.indexOf(bankAccount.businessEntityId) >= 0
                    && this.bankAccountsService.state.selectedBankAccountIds.indexOf(bankAccount.id) >= 0
                )
                    selectedBankAccountIds.push(bankAccount.id);
            });
        });

        this.bankAccountsService.changeState({
            selectedBusinessEntitiesIds: businessEntitiesIds,
            selectedBankAccountIds: selectedBankAccountIds
        });

        this.onClosed.emit(businessEntitiesIds);
    }
}
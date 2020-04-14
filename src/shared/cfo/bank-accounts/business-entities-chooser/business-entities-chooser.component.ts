/** Core imports */
import { Component, Input, Output, EventEmitter, ViewChild, OnDestroy, ElementRef } from '@angular/core';

/** Third party imports */
import { DxTreeViewComponent } from 'devextreme-angular/ui/tree-view';
import { DxDropDownBoxComponent } from 'devextreme-angular/ui/drop-down-box';
import difference from 'lodash/difference';
import { Observable } from 'rxjs';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { BankAccountsService } from '@shared/cfo/bank-accounts/helpers/bank-accounts.service';
import { AppConsts } from '@shared/AppConsts';
import { ArrayHelper } from '@shared/helpers/ArrayHelper';
import { BusinessEntityDto } from '../../../service-proxies/service-proxies';

@Component({
    selector: 'business-entities-chooser',
    templateUrl: './business-entities-chooser.component.html',
    styleUrls: ['./business-entities-chooser.component.less']
})
export class BusinessEntitiesChooserComponent implements OnDestroy {
    @ViewChild(DxTreeViewComponent, { static: false }) treeList: DxTreeViewComponent;
    @ViewChild(DxDropDownBoxComponent, { static: false }) dropDown: DxDropDownBoxComponent;

    private syncAccSub = this.bankAccountsService.syncAccounts$.subscribe(
        syncAccounts => this.syncAccounts = syncAccounts);
    private isFilterClick;

    @Input() staticItemsText;
    @Input() applyFilter = true;
    @Input() popupWidth: string;
    @Input() allSelectedTitle = false;

    @Output() selectionChanged: EventEmitter<any> = new EventEmitter();
    @Output() onFilterButtonClick: EventEmitter<any> = new EventEmitter();
    @Output() onChanged: EventEmitter<any> = new EventEmitter();
    @Output() onClosed: EventEmitter<any> = new EventEmitter();

    syncAccounts  = [];
    selectedItems = [];
    selectedAll;
    businessEntities$: Observable<BusinessEntityDto[]> = this.bankAccountsService.sortedBusinessEntities$;

    constructor(
        private ls: AppLocalizationService,
        private bankAccountsService: BankAccountsService,
        public elementRef: ElementRef
    ) {}

    public selectedItemsChange() {
        setTimeout(() =>
            this.selectionChanged.emit(this.getSelectedIds()));
    }

    getSelectedIds() {
        return this.selectedItems.map(item => item.id);
    }

    getSelectedTitle(data) {
        this.updateSelectedItems(data);
        if (this.staticItemsText)
            return this.staticItemsText;

        let selectedCount = this.selectedItems.length,
            totalCount = data.length;
        return selectedCount ? (this.allSelectedTitle && selectedCount == totalCount
            ? '' : this.getItemsTitle(data)) + ' \u25BE' : '';
    }

    getItemsTitle(data) {
        let firstSelected = data.find(item => item.selected),
            moreCount = this.selectedItems.length - 1;
        return firstSelected ? firstSelected.name + (moreCount ? ' +' + moreCount : '') : '';
    }

    updateSelectedItems(data) {
        this.selectedItems = data.filter(item => item.selected);
        let selectedCount = this.selectedItems.length;
        this.selectedAll = selectedCount ? (selectedCount == data.length || undefined) : false;
    }

    onPopupOpened(event, data) {
        if (this.popupWidth || AppConsts.isMobile)
            event.component._popup.option('width', this.popupWidth ? this.popupWidth : '180px');
        if (this.treeList)
            this.treeList.instance.option('dataSource', data);
    }

    onSelectAll(event) {
        if (this.treeList && typeof(event.value) == 'boolean') {
            event.value ? this.treeList.instance.selectAll()
                : this.treeList.instance.unselectAll();
            event.component.option('text', (event.value ? this.ls.l('Clear')
                : this.ls.l('Select')) + ' ' + this.ls.l('All'));
        }
    }

    onPopupClosed() {
        let businessEntitiesIds = this.getSelectedIds();
        if (this.applyFilter) {
            let selectedBankAccountIds = [];

            if (this.selectedBusinessEntitiesChanged(businessEntitiesIds)) {
                let newBusinessEntitiesIds = difference(
                    businessEntitiesIds,
                    this.bankAccountsService.state.selectedBusinessEntitiesIds
                );

                this.syncAccounts.forEach(syncAccount => {
                    syncAccount.bankAccounts.forEach(bankAccount => {
                        if (!businessEntitiesIds.length || (newBusinessEntitiesIds.indexOf(bankAccount.businessEntityId) >= 0
                            || businessEntitiesIds.indexOf(bankAccount.businessEntityId) >= 0
                            && this.bankAccountsService.state.selectedBankAccountIds.indexOf(bankAccount.id) >= 0
                        ))
                            selectedBankAccountIds.push(bankAccount.id);
                    });
                });
                const state = { selectedBusinessEntitiesIds: businessEntitiesIds };
                if (
                    selectedBankAccountIds.length &&
                    ArrayHelper.dataChanged(this.bankAccountsService.state.selectedBankAccountIds, selectedBankAccountIds)
                ) {
                    state['selectedBankAccountIds'] = selectedBankAccountIds;
                }
                this.bankAccountsService.changeState(state);
                this.bankAccountsService.applyFilter();
                this.onChanged.emit(businessEntitiesIds);
            }
        }
        this.onClosed.emit();
        if (this.isFilterClick)
            this.onFilterButtonClick.emit(businessEntitiesIds);
        this.isFilterClick = false;
    }

    /**
     * Whether selected business entities changed
     * @param {number[]} selectedBusinessEntitiesIds
     * @return {boolean}
     */
    private selectedBusinessEntitiesChanged(selectedBusinessEntitiesIds: number[]): boolean {
        return ArrayHelper.dataChanged(this.bankAccountsService.state.selectedBusinessEntitiesIds, selectedBusinessEntitiesIds);
    }

    filterButtonClick() {
        this.isFilterClick = true;
        if (this.dropDown && this.dropDown.instance)
            this.dropDown.instance.close();
    }

    ngOnDestroy() {
        this.syncAccSub.unsubscribe();
    }
}

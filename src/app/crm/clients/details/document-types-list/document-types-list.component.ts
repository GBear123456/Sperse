import {Component, Injector, Input, EventEmitter, Output, OnInit} from '@angular/core';

import * as _ from 'underscore';
import { finalize } from 'rxjs/operators';

import { AppComponentBase } from '@shared/common/app-component-base';
import { AppConsts } from '@shared/AppConsts';
import { DocumentTypeServiceProxy, UpdateDocumentTypeInput, CreateDocumentTypeInput, DocumentTypeInfo } from '@shared/service-proxies/service-proxies';

@Component({
  selector: 'crm-document-types-list',
  templateUrl: './document-types-list.component.html',
  styleUrls: ['./document-types-list.component.less'],
  providers: [DocumentTypeServiceProxy]
})
export class DocumentTypesListComponent extends AppComponentBase implements OnInit {
    @Input() set selectedItem(value) {
        this.selectedDocumentTypeId = value;
        this.selectedDocumentTypes = [value];
    }
    @Input() documentTypes: DocumentTypeInfo[];
    @Output() onItemSelected: EventEmitter<any> = new EventEmitter();

    private _prevClickDate = new Date();

    dropDownComponent: any;
    listComponent: any;

    selectedDocumentTypes = [];
    selectedDocumentTypeId: number;
    list: any = [];

    lastNewAdded: any;
    addNewTimeout: any;

    constructor(
        injector: Injector,
        private _documentTypeService: DocumentTypeServiceProxy
    ) {
        super(injector, AppConsts.localization.CRMLocalizationSourceName);
    }

    onDropDownInitialized(event) {
        this.dropDownComponent = event.component;
    }

    onValueChanged(event) {
        let value = event.value;
        if (!value)
            this.selectedDocumentTypes = [];
    }

    apply() {
        this.selectedDocumentTypeId = this.selectedDocumentTypes[0];

        if (this.dropDownComponent)
            this.dropDownComponent.close();

        if (this.listComponent)
            setTimeout(() => { this.listComponent.option('searchPanel.text', undefined); }, 500);

        this.onItemSelected.emit();
    }

    onListInitialized(event) {
        this.listComponent = event.component;
    }

    ngOnInit() {
        if (this.documentTypes) {
            this.list = this.prepareDataSource(this.documentTypes);
        } else {
            this.refresh();
        }
    }

    refresh() {
        this._documentTypeService.getAll().subscribe((result) => {
            this.list = this.prepareDataSource(result);
        });
    }

    prepareDataSource(list) {
        return list.map((obj) => {
            obj['parent'] = 0;
            return obj;
        });
    }

    addActionButton(name, container: HTMLElement, callback) {
        let buttonElement = document.createElement('a');
        buttonElement.innerText = this.l(this.capitalize(name));
        buttonElement.className = 'dx-link dx-link-' + name;
        buttonElement.addEventListener('click', callback);
        container.appendChild(buttonElement);
    }

    onCellPrepared($event) {
        if ($event.rowType === 'data' && $event.column.command === 'edit') {
            this.addActionButton('delete', $event.cellElement, (event) => {
                if ($event.data.hasOwnProperty('id'))
                    this.listComponent.deleteRow(
                        this.listComponent.getRowIndexByKey($event.data.id));
                else
                    $event.component.cancelEditData();
            });
        }
    }

    onRowRemoving($event) {
        let isItemDeleted = false;
        this._documentTypeService.delete($event.key)
        .pipe(finalize(() => {
            if (!isItemDeleted && this.dropDownComponent)
                this.dropDownComponent.close();
        }))
        .subscribe((response) => {
            isItemDeleted = true;
            if (response)
                $event.cancel = true;
        });
    }

    onRowUpdating($event) {
        let name = $event.newData.name.trim();

        if (!name || this.IsDuplicate(name)) {
            $event.cancel = true;
            return;
        }

        this._documentTypeService.update(UpdateDocumentTypeInput.fromJS({
            id: $event.oldData.id,
            name: name
        })).subscribe((response) => {
            if (response)
                $event.cancel = true;
        });
    }

    onInitNewRow($event) {
        $event.data.name = $event.component.option('searchPanel.text');
    }

    onRowInserting($event) {
        let name = $event.data.name.trim();
        if (!name || this.IsDuplicate(name)) {
            $event.cancel = true;
            return;
        }

        this._documentTypeService.create(CreateDocumentTypeInput.fromJS({
            name: name
        })).subscribe((id) => {
            if (id) {
                this.refresh();
                this.selectedDocumentTypes = [id];
            } else {
                $event.cancel = true;
            }
        });
    }

    onRowInserted($event) {
        this.lastNewAdded = $event.data;
    }

    IsDuplicate(name) {
        let nameNormalized = name.toLowerCase();
        let duplicates = _.filter(this.list, (obj) => {
            return (obj.name.toLowerCase() == nameNormalized);
        });
        return duplicates.length > 0;
    }

    onSelectionChanged($event) {
        this.selectedDocumentTypes = $event.selectedRowKeys;
    }

    editorPrepared($event) {
        // to prevent raising onEditorPrepared event from grid when dropdown is opening
        if (this.documentTypes) {
            $event.cancel = true;
            return;
        }

        if (!$event.value && $event.editorName == 'dxTextBox') {
            if ($event.editorElement.closest('tr')) {
                if (this.addNewTimeout)
                    this.addNewTimeout = null;
                else {
                    $event.component.cancelEditData();
                    let scrollable = $event.component.getScrollable();
                    if (scrollable)
                        scrollable.scrollTo(0);
                    this.addNewTimeout = setTimeout(() => {
                        $event.component.addRow();
                    });
                }
            }
        }
    }

    onRowClick($event) {
        let nowDate = new Date();
        if (nowDate.getTime() - this._prevClickDate.getTime() < 500) {
            $event.event.originalEvent.preventDefault();
            $event.event.originalEvent.stopPropagation();
            $event.component.editRow($event.rowIndex);
        }
        this._prevClickDate = nowDate;
    }

    onKeyDown($event) {
        if ($event.event.keyCode == 13) {
            $event.event.preventDefault();
            $event.event.stopPropagation();
            $event.component.focus($event.component.getCellElement(0, 0));
            $event.component.saveEditData();
        }
    }

    customSortingMethod = (item1, item2) => {
        if (this.lastNewAdded) {
            if (this.lastNewAdded.name == item1)
                return -1;
            else if (this.lastNewAdded.name == item2)
                return 1;
        }
        return 0;
    }
}

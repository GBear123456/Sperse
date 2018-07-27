/** Core imports */
import { Component, Injector, Input, Output, EventEmitter, ViewChild, OnInit} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material';

/** Third party imports */
import { MatHorizontalStepper } from '@angular/material';
import { Papa } from 'ngx-papaparse';
import { UploadFile } from 'ngx-file-drop';
import { DxDataGridComponent, DxProgressBarComponent } from 'devextreme-angular';

import * as _ from 'underscore';
import * as _s from 'underscore.string';

/** Application imports */
import { AppComponentBase } from '@shared/common/app-component-base';
import { ConfirmImportDialog } from './confirm-import-dialog/confirm-import-dialog.component';
import { AppConsts } from '@shared/AppConsts';

@Component({
    selector: 'import-wizard',
    templateUrl: 'import-wizard.component.html',
    styleUrls: ['import-wizard.component.less']
})
export class ImportWizardComponent extends AppComponentBase implements OnInit {
    @ViewChild(MatHorizontalStepper) stepper: MatHorizontalStepper;
    @ViewChild('mapGrid') mapGrid: DxDataGridComponent;
    @ViewChild('reviewGrid') reviewGrid: DxDataGridComponent;
    @ViewChild(DxProgressBarComponent) reviewProgress: DxProgressBarComponent;

    @Input() title: string;
    @Input() icon: string;
    @Input() checkSimilarFields: Array<any>;
    @Input() columnsConfig: any = {};
    @Input() localizationSource: string;
    @Input() lookupFields: any;
    @Input() preProcessFieldBeforeReview: Function;
    @Input() validateFieldsMapping: Function;
    @Input() set fields(list: string[]) {
        this.lookupFields = list.map((field) => {
            return {
                id: field,
                name: this.capitalize(field)
            };
        });
    }
    @Input()
    set toolbarConfig(config: any[]) {
        this._toolbarConfig = config;
    }

    @Output() onCancel: EventEmitter<any> = new EventEmitter();
    @Output() onComplete: EventEmitter<any> = new EventEmitter();

    public static readonly FieldSeparator = '_';
    public static readonly FieldLocalizationPrefix = 'Import';

    uploadFile: FormGroup;
    dataMapping: FormGroup;
    mapAllowedNextValue: any;

    _toolbarConfig: any[];
    private files: UploadFile[] = [];
    private duplicateCounts: any = {};
    private reviewGroups: any = [];
    private validateFieldList: string[] = ['email', 'phone', 'url'];
    private invalidRowKeys: any = {};
    private similarFieldsIndex: any = {};

    readonly UPLOAD_STEP_INDEX  = 0;
    readonly MAPPING_STEP_INDEX = 1;
    readonly REVIEW_STEP_INDEX  = 2;
    readonly FINISH_STEP_INDEX  = 3;

    showSteper = true;
    loadProgress = 0;
    dropZoneProgress = 0;

    fileData: any;
    fileName = '';
    fileSize = '';
    fileHasHeader = false;
    fileHeaderWasGenerated = false;

    selectedPreviewRows: any = [];
    reviewDataSource: any;
    mapDataSource: any;

    selectModeItems = [
        {text: 'Affect on page items', mode: 'page'},
        {text: 'Affect all pages items', mode: 'allPages'}
    ];

    constructor(
        injector: Injector,
        private _parser: Papa,
        private _dialog: MatDialog,
        private _formBuilder: FormBuilder
    ) {
        super(injector);
        this.uploadFile = _formBuilder.group({
            url: ['', Validators.pattern(/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/)],
            valid: ['', () => {
                return this.checkFileDataValid() ? null : { 'required': true };
            }]
        });
        this.dataMapping = _formBuilder.group({
            valid: ['', () => {
                let validationResult: any = { 'required': true };
                if (this.validateFieldsMapping)
                    _.extend(validationResult, this.validateFieldsMapping(this.getMappedFields()));
                return validationResult && validationResult.isMapped && !validationResult.error ? null : validationResult;
            }]
        });
    }

    ngOnInit() {
        this.localizationSourceName = this.localizationSource;
    }

    reset(callback = null) {
        this.fileData = null;
        this.dropZoneProgress = 0;
        this.loadProgress = 0;
        this.showSteper = false;
        this.uploadFile.reset();
        this.dataMapping.reset();
        this.mapDataSource = [];
        this.emptyReviewData();

        setTimeout(() => {
            this.showSteper = true;
            callback && callback();
        });
    }

    next() {
        if (this.stepper.selectedIndex == this.UPLOAD_STEP_INDEX) {
            this.uploadFile.controls.valid.updateValueAndValidity();
            if (this.uploadFile.valid) {
                this.buildMappingDataSource();
                this.stepper.next();
            } else
                this.message.error(this.l('ChooseCorrectCSV'));
        } else if (this.stepper.selectedIndex == this.MAPPING_STEP_INDEX) {
            this.dataMapping.controls.valid.updateValueAndValidity();
            if (this.dataMapping.valid) {
                this.initReviewDataSource(this.getMappedFields());
                this.stepper.next();
            } else {
                this.highlightUnmappedFields(this.getMappedFields());
                this.message.error(this.dataMapping.controls.valid.errors.error || this.l('MapAllRecords'));
            }
        } else if (this.stepper.selectedIndex == this.REVIEW_STEP_INDEX) {
            let gridElm = this.reviewGrid.instance.element();
            if (gridElm.getElementsByClassName('invalid').length) {
                let dialogData = {option: 'ignore'};
                this._dialog.open(ConfirmImportDialog, {
                    data: dialogData
                }).afterClosed().subscribe(result => {
                    if (result) {
                        let records = this.reviewGrid.instance.getSelectedRowsData();
                        records = records.length && records || this.reviewDataSource;
                        if (dialogData.option == 'ignore')
                            this.complete(records.map((row) => {
                                if (this.invalidRowKeys[row.uniqueIdent]) {
                                    this.invalidRowKeys[row.uniqueIdent].forEach((field) => {
                                        row[field] = null;
                                    });
                                }
                                return row;
                            }));
                        else
                            this.complete(records.filter((row) =>
                                !this.invalidRowKeys[row.uniqueIdent]));
                    }
                });
            } else
                this.complete();
        }
    }

    getMappedFields() {
        let mappedFields = this.mapGrid &&
            this.mapGrid.instance.getSelectedRowsData() || [];
        if (!mappedFields.length) {
            mappedFields = this.mapDataSource && this.mapDataSource.store &&
                this.mapDataSource.store.data.filter((row) => {
                    return !!row.mappedField;
                }) || [];
        }
        return mappedFields;
    }

    cancel() {
        this.reset(() => {
            this.onCancel.emit();
        });
    }

    complete(rows = null) {
        let data = rows || this.reviewGrid.instance.getSelectedRowsData();
        this.onComplete.emit(data.length && data || this.reviewDataSource);
    }

    showFinishStep() {
        this.stepper.selectedIndex = this.FINISH_STEP_INDEX;
    }

    emptyReviewData() {
        this.reviewDataSource = [];
        this.selectedPreviewRows = [];
        this.duplicateCounts = {};
        this.reviewGroups = [];
        this.invalidRowKeys = {};
        this.similarFieldsIndex = {};
    }

    initReviewDataSource(mappedFields) {
        this.emptyReviewData();
        setTimeout(() => {
            let dataSource = [], progress = 0, totalCount = this.fileData.data.length - (this.fileHasHeader ? 0: 1),
                onePercentCount = totalCount < 100 ? totalCount : Math.ceil(totalCount / 100),
                columnsIndex = {}, columnCount = 0;

            let processPartially = () => {
                for (var index = onePercentCount * progress; index < Math.min(onePercentCount * (progress + 1), totalCount); index++) {
                    let row = this.fileData.data[index];
                    if (index) {
                        if (row.length == columnCount) {
                            let data = {};
                            mappedFields.forEach((field) => {
                                let value = row[columnsIndex[field.sourceField]].trim();
                                if (!(this.preProcessFieldBeforeReview && this.preProcessFieldBeforeReview(field, value, data))
                                    && !data[field.mappedField]) data[field.mappedField] = value;
                            });
                            if (!this.checkDuplicate(row, data)) {
                                this.checkSimilarGroups(data);
                                dataSource.push(data);
                            }
                        }
                    } else {
                        columnCount = row.length;
                        row.forEach((item, index) => {
                            columnsIndex[item] = index;
                        });
                    }
                }

                if (index < totalCount) {
                    this.reviewProgress.instance.option('value', ++progress);
                    setTimeout(() => processPartially(), 100);
                } else {
                    this.updateGroupNames();
                    this.reviewProgress.instance.option('value', 100);
                    this.reviewDataSource = dataSource;

                    setTimeout(() => {
                        this.reviewProgress.instance.option('visible', false);
                    }, 1000);
                }
            };

            this.reviewProgress.instance.option('visible', true);
            setTimeout(() => processPartially(), 100);
        });
    }

    updateGroupNames() {
        let reviewGroupsName = [],
            showFields = this.checkSimilarFields[0][0].split(':');
        this.reviewGroups.forEach((group, index) => {
            if (group && group.length) {
                let item = group[group.length - 1];
                if (group.length > 1) {
                    let groupName = showFields.map((fld) => item[fld]).join(' ');
                    reviewGroupsName.push(groupName);
                    group.forEach((item) => {
                        item.compared = groupName;
                    });
                } else
                    item.compared = this.l('Unique records');
                this.selectedPreviewRows.push(item.uniqueIdent);
            }
        });
        this.reviewGroups = reviewGroupsName;
    }

    getUniqueIdent(list) {
        let id = 0;
        list.forEach((value) => {
            if (value)
                for (let i = 0; i < value.length; i++)
                    id = (id << 5) - id + value[i].toLowerCase().charCodeAt(0);
        });
        return id;
    }

    checkDuplicate(raw, row) {
        let ident = this.getUniqueIdent(raw),
            count = this.duplicateCounts[ident];

        row.uniqueIdent = ident;
        return (this.duplicateCounts[ident] =
            (count || 0) + 1) > 1;
    }

    checkSimilarGroups(row) {
        let newGroup = [row], newGroupIndex = 0;
        if (newGroupIndex = this.reviewGroups.length) {
            let mergeGroupsIndex = [], fieldsIndex = [];

            this.checkSimilarFields.forEach((fields) => {
                fields.forEach((field) => {
                    let conditionValues = field.split(':').map((fld) => {
                            return row[fld] || '';
                        }), fieldIndex = conditionValues.every(Boolean) ?
                            this.getUniqueIdent(conditionValues) : 0;
                    if (fieldIndex) {
                        fieldsIndex.push(fieldIndex);
                        let groupIndex = this.similarFieldsIndex[fieldIndex];
                        if (groupIndex) {
                            mergeGroupsIndex.push(groupIndex);
                            row.highliteFields = conditionValues;

                            let group = this.reviewGroups[groupIndex];
                            if (group && group.length == 1)
                                group[0].highliteFields = conditionValues;
                        } else
                            this.similarFieldsIndex[fieldIndex] = newGroupIndex;
                    }
                });
            });

            if (mergeGroupsIndex.length) {
                mergeGroupsIndex.forEach((index) => {
                    if (this.reviewGroups[index])
                        newGroup = newGroup.concat(this.reviewGroups[index]);
                    delete this.reviewGroups[index];
                });
                fieldsIndex.forEach((index) => {
                    this.similarFieldsIndex[index] = newGroupIndex;
                });
                this.reviewGroups.push(newGroup);

                return;
            }
        }

        this.reviewGroups.push(newGroup);
    }

    highlightUnmappedFields(rows) {
        rows.forEach(row => {
            if (!row.mappedField)
                this.highlightUnmappedField(row);
        });
    }

    highlightUnmappedField(row) {
        let rowIndex = this.mapGrid.instance.getRowIndexByKey(row.id);
        let cellElement = this.mapGrid.instance.getCellElement(rowIndex, 'mappedField');
        let rows = cellElement.closest('.dx-datagrid-rowsview').querySelectorAll(`tr:nth-of-type(${rowIndex + 1})`);
        for (let i = 0; i < rows.length; i++) {
            rows[i].classList.add(`unmapped-field`);
        }
    }

    checkFileDataValid() {
        return this.fileData && !this.fileData.errors.length
            && this.fileData.data.length;
    }

    parse(content) {
        this._parser.parse(content.trim(), {
            complete: (results) => {
                if (results.errors.length)
                    this.message.error(this.l('IncorrectFileFormatError'));
                else {
                    this.fileHeaderWasGenerated = false;
                    this.fileData = results;
                    this.checkIfFileHasHeaders();
                }
            }
        });
    }

    getFileSize(size) {
        return (size / 1024).toFixed(2) + 'KB';
    }

    loadFileContent(file) {
        this.loadProgress = 0;
        this.fileName = file.name;
        this.fileSize = this.getFileSize(file.size);
        let reader = new FileReader();
        reader.onload = (event) => {
            this.dropZoneProgress = 101;
            this.parse(reader.result);
        };
        reader.onprogress = (event) => {
            if (event.total > event.loaded)
                this.dropZoneProgress = Math.round(
                    event.loaded / event.total * 100);
        };
        reader.readAsText(file);
    }

    fileDropped(event) {
        this.files = event.files;
        for (let file of this.files) {
            if (file.fileEntry)
                file.fileEntry['file'](this.loadFileContent.bind(this));
            else
                this.loadFileContent(file);
        }
    }

    buildMappingDataSource() {
        if (this.fileData && this.fileData.data && this.fileData.data.length) {
            if (!this.fileHasHeader && !this.fileHeaderWasGenerated) {
                let columnsCount = this.fileData.data[0].length;
                let headers: string[] = [];
                for (let i = 0; i < columnsCount; i++) {
                    headers.push(`Column ${i + 1}`);
                }

                this.fileData.data.unshift(headers);
                this.fileHeaderWasGenerated = true;
            } else if (this.fileHasHeader && this.fileHeaderWasGenerated) {
                this.fileData.data.shift();
                this.fileHeaderWasGenerated = false;
            }

            let data = this.fileData.data[0].map((field, index) => {
                let fieldId;
                return {
                    id: index,
                    sourceField: field,
                    sampleValue: this.lookForValueExample(index),
                    mappedField: this.lookupFields.every((item) => {
                        let isSameField = item.id.split(ImportWizardComponent.FieldSeparator).pop().toLowerCase() == field.toLowerCase();
                        if (isSameField)
                            fieldId = item.id;
                        return !isSameField;
                    }) ? '' : fieldId
                };
            });

            this.mapDataSource = {
                store: {
                    type: 'array',
                    key: 'id',
                    data: data
                }
            };
        }
    }

    checkIfFileHasHeaders() {
        if (this.fileData.data.length) {
            const constNames = ['name', 'email', 'number', 'phone'];
            let namesFoundCount = 0;

            for (let i = 0; i < constNames.length; i++) {
                let nameIsPresent = false;
                this.fileData.data[0].forEach((val: string) => {
                    if (val.toLowerCase().indexOf(constNames[i]) != -1)
                        nameIsPresent = true;
                });
                if (nameIsPresent) {
                    namesFoundCount++;
                }
            }

            this.fileHasHeader = namesFoundCount >= 2;
        }
    }

    lookForValueExample(fieldIndex) {
        let notEmptyIndex = 1;
        this.fileData.data.every((record, index) => {
            notEmptyIndex = index || notEmptyIndex;
            return !index || !record[fieldIndex];
        });
        return this.fileData.data[notEmptyIndex][fieldIndex];
    }

    fileSelected($event) {
        if ($event.target.files.length)
            this.fileDropped({files: $event.target.files});
    }

    downloadFromURL() {
        if (!this.uploadFile.get('url').invalid) {
            let url = this.uploadFile.value.url;
            if (url)
                this.getFile(url, (result) => {
                    if (result.target.status == 200) {
                        this.fileName = decodeURI(url.split('?')[0].split('/').pop());
                        this.fileSize = this.getFileSize(result.loaded);
                        this.parse(result.target.responseText);
                    } else {
                        this.message.error(result.target.statusText);
                    }
                });
            else
                this.message.error(this.l('FieldEmptyError', [this.l('URL')]));
        }
    }

    getFile(path: string, callback: Function) {
        this.dropZoneProgress = 0;
        let request = new XMLHttpRequest();
        request.addEventListener('load', (event) => {
            this.loadProgress = 101;
            callback(event);
        });
        request.addEventListener('progress', (event) => {
            if (event.total > event.loaded)
                this.loadProgress = Math.round(event.loaded / event.total * 100);
        });
        request.open('GET', path, true);
        request.setRequestHeader('Accept', '*/*');
        request.setRequestHeader('Content-Type', 'application/*');

        request.send();
    }

    onRowValidating($event) {
        if ($event.newData.mappedField)
            $event.component.selectRows([$event.key]);
        else
            $event.component.deselectRows([$event.key]);

        this.mapDataSource.store.data.forEach((row) => {
            if ($event.oldData.sourceField != row.sourceField &&
                $event.newData.mappedField && $event.newData.mappedField == row.mappedField) {
                $event.isValid = false;
                $event.errorText = this.l('FieldMapError', [row.sourceField]);
            }
        });
        if ($event.isValid)
            this.mapGrid.instance.closeEditCell();
    }

    selectionModeChanged($event) {
        this.reviewGrid.instance.option(
            'selection.selectAllMode', $event.itemData.mode);
    }

    onContentReady($event) {
        let selectedRows = [];
        $event.component.getVisibleRows().forEach((row) => {
            if (row.data.mappedField)
                selectedRows.push(row.data.id);
        });
        $event.component.selectRows(selectedRows);
    }

    onMapCellClick($event) {
        if (typeof($event.displayValue) === 'boolean') {
            $event.component.deselectRows([$event.data.id]);
            $event.data.mappedField = '';
        }
    }

    onMapSelectionChanged($event) {
        $event.selectedRowsData.forEach((row) => {
            if (!row.mappedField)
                $event.component.deselectRows([row.id]);
        });
    }

    onLookupFieldsContentReady($event, cell) {
        $event.component.unselectAll();
        $event.component.selectItem(cell.value);
    }

    onLookupFieldsItemRendered($event) {
        this.mapGrid.instance.getSelectedRowsData().forEach((row) => {
            if (row.mappedField == $event.itemIndex)
                $event.itemElement.classList.add('mapped');
        });
    }

    public static getFieldLocalizationName(dataField: string): string {
        let parts = dataField.split(ImportWizardComponent.FieldSeparator);
        let partsCapitalized = parts.map(p => _s.capitalize(p));
        partsCapitalized.unshift(ImportWizardComponent.FieldLocalizationPrefix);
        return partsCapitalized.join(ImportWizardComponent.FieldSeparator);
    }

    customizePreviewColumns = (columns) => {
        columns.forEach((column) => {
            if (['uniqueIdent', 'highliteFields'].indexOf(column.dataField) >= 0)
                return column.visible = false;

            let columnConfig = this.columnsConfig[column.dataField];
            if (column.dataField == 'compared') {
                if (this.reviewGroups.length)
                    column.groupIndex = 0;
                else {
                    column.visible = false;
                    this.selectedPreviewRows = [];
                }
            } else {
                if (columnConfig)
                    _.extend(column, columnConfig);
                this.initColumnTemplate(column);
//                this.updateColumnOrder(column);
            }

            if (!columnConfig || !columnConfig['caption'])
                column.caption = this.l(ImportWizardComponent.getFieldLocalizationName(column.dataField));
        });
    }

/*
    !!VP will be enabled later
    updateColumnOrder(column) {
        column.visibleIndex = undefined;
        this.checkSimilarFields.forEach((list, index) => {
            let parts = list.split(':'),
                insideIndex = parts.indexOf(column.dataField);

            if (insideIndex >= 0)
                column.visibleIndex = index + insideIndex;
        });
    }
*/

    initColumnTemplate(column) {
        let field;
        this.validateFieldList.some((fld) => {
            if (column.dataField.toLowerCase().includes(fld))
                return Boolean(field = fld);
        });

        if (field)
            column.cellTemplate = field + 'Cell';
    }

    checkFieldValid(field, dataCell) {
        let value = dataCell.value;
        let isValid = !value || AppConsts.regexPatterns[field].test(value);
        if (!isValid) {
            if (this.invalidRowKeys[dataCell.key])
                this.invalidRowKeys[dataCell.key].push(dataCell.column.dataField);
            else
                this.invalidRowKeys[dataCell.key] = [dataCell.column.dataField];
        }

        return isValid;
    }

    onReviewCellPrepared($event) {
        if ($event.data && $event.data.highliteFields &&
            $event.data.highliteFields.indexOf($event.value) >= 0
        ) $event.cellElement.classList.add('bold');
    }

}

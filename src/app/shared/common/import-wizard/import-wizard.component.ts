/** Core imports */
import { Component, Injector, Input, Output, EventEmitter, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';

/** Third party imports */
import { MatHorizontalStepper } from '@angular/material/stepper';
import { Papa } from 'ngx-papaparse';
import { UploadFile } from 'ngx-file-drop';
import { DxDataGridComponent } from 'devextreme-angular/ui/data-grid';
import { DxProgressBarComponent } from 'devextreme-angular/ui/progress-bar';

import * as _ from 'underscore';
import capitalize from 'underscore.string/capitalize';

/** Application imports */
import { AppComponentBase } from '@shared/common/app-component-base';
import { ConfirmImportDialog } from './confirm-import-dialog/confirm-import-dialog.component';
import { AppConsts } from '@shared/AppConsts';
import { PhoneNumberService } from '@shared/common/phone-numbers/phone-number.service';
import { ImportServiceProxy, ImportFieldInfoDto } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'import-wizard',
    templateUrl: 'import-wizard.component.html',
    styleUrls: ['import-wizard.component.less'],
    providers: [ PhoneNumberService ]
})
export class ImportWizardComponent extends AppComponentBase implements OnInit, AfterViewInit {
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
    @Output() onSelectionChanged: EventEmitter<any> = new EventEmitter();

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

    readonly UPLOAD_STEP_INDEX = 0;
    readonly MAPPING_STEP_INDEX = 1;
    readonly REVIEW_STEP_INDEX = 2;
    readonly FINISH_STEP_INDEX = 3;

    selectedStepIndex = 0;
    showSteper = true;
    loadProgress = 0;
    dropZoneProgress = 0;

    fileData: any;
    fileName = '';
    fileSize = '';
    fileContent = '';
    fileOrigSize = 0;
    fileHasHeader = false;
    fileHeaderWasGenerated = false;

    selectedPreviewRows: any = [];
    reviewDataSource: any;
    mapDataSource: any;
    selectedMapRowKeys: number[] = [];

    selectModeItems = [
        { text: 'Affect on page items', mode: 'page' },
        { text: 'Affect all pages items', mode: 'allPages' }
    ];

    constructor(
        injector: Injector,
        private _parser: Papa,
        private _dialog: MatDialog,
        private _formBuilder: FormBuilder,
        private _importProxy: ImportServiceProxy,
        private _phoneNumberService: PhoneNumberService
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

    ngAfterViewInit() {
        this.selectedStepChanged(null);
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
        this.selectedStepIndex = 0;

        setTimeout(() => {
            this.showSteper = true;
            callback && callback();
        });
    }

    next() {
        if (this.stepper.selectedIndex == this.UPLOAD_STEP_INDEX) {
            this.uploadFile.controls.valid.updateValueAndValidity();
            if (this.uploadFile.valid)
                this.buildMappingDataSource().then(() => this.stepper.next());
            else
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
            if (Object.keys(this.invalidRowKeys).length) {
                let dialogData = { importAll: true };
                this._dialog.open(ConfirmImportDialog, {
                    data: dialogData
                }).afterClosed().subscribe(result => {
                    if (result) {
                        let records = this.reviewGrid.instance.getSelectedRowsData();
                        records = records.length && records || this.reviewDataSource;
                        if (dialogData.importAll)
                            this.complete(records.map((row) => {
                                let rowData = row;
                                if (this.invalidRowKeys[row.uniqueIdent]) {
                                    rowData = _.clone(row);
                                    this.invalidRowKeys[row.uniqueIdent].forEach((field) => {
                                        rowData[field] = undefined;
                                    });
                                }
                                return rowData;
                            }), dialogData.importAll);
                        else
                            this.complete(records.filter((row) => {
                                return !this.invalidRowKeys[row.uniqueIdent];
                            }), dialogData.importAll);
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

    complete(rows = null, importAll = false) {
        if (rows && !rows.length)
            return this.message.info(this.l('Import_NoRecordsAvailable'));

        let data = rows || this.reviewGrid.instance.getSelectedRowsData();
        this.onComplete.emit({
            fields: this.fileHeaderWasGenerated ? undefined :
                this.getMappedFields().map((entity) => {
                    return ImportFieldInfoDto.fromJS({
                        inputFieldName: entity.sourceField,
                        outputFieldName: entity.mappedField
                    });
                }
            ),
            records: data.length && data || this.reviewDataSource,
            importAll: importAll,
        });
    }

    showFinishStep() {
        this.stepper.selectedIndex =
            this.selectedStepIndex =
                this.FINISH_STEP_INDEX;
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
            let dataSource = [], progress = 0, totalCount = this.fileData.data.length - (this.fileHasHeader ? 0 : 1),
                onePercentCount = totalCount < 100 ? totalCount : Math.ceil(totalCount / 100),
                columnsIndex = {}, columnCount = 0;

            let processPartially = () => {
                for (var index = onePercentCount * progress; index < Math.min(onePercentCount * (progress + 1), totalCount); index++) {
                    let row = this.fileData.data[index];
                    if (index) {
                        if (row.length == columnCount) {
                            let data = {};
                            mappedFields.forEach((field) => {
                                let value = (row[columnsIndex[field.sourceField]] || '').trim();
                                if (!(this.preProcessFieldBeforeReview && this.preProcessFieldBeforeReview(field, value, data))
                                    && !data[field.mappedField]) data[field.mappedField] = value;
                            });
                            if (!this.checkDuplicate(row, data)) {
                                this.checkSimilarGroups(data);
                                this.validateRowFields(data);
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
                    this.reviewDataSource = dataSource;
                    this.reviewProgress.instance.option('value', 100);
                    this.reviewProgress.instance.option('visible', false);
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
        let errors = this.fileData && this.fileData.errors || [];
        return this.fileData
            && (!errors.length || (errors.length == 1 && errors[0].code == "UndetectableDelimiter"))
            && this.fileData.data.length;
    }

    parse(content) {
        this.fileContent = content.trim();
        this._parser.parse(this.fileContent, {
            complete: (results) => {
                this.fileData = results;
                if (!this.checkFileDataValid())
                    this.message.error(this.l('IncorrectFileFormatError'));
                else {
                    this.fileHeaderWasGenerated = false;
                    this.checkIfFileHasHeaders();
                }
            }
        });
    }

    getFileSize(size) {
        return (size / 1024).toFixed(2) + 'KB';
    }

    loadFileContent(file) {
        if (file.size > 25 * 1024 * 1024) {
            abp.message.warn(this.l('FilesizeLimitWarn', 25));
            this.files = [];
            return;
        }

        this.loadProgress = 0;
        this.fileName = file.name;
        this.fileOrigSize = file.size;
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
        if (this.files.length) {
            var file = this.files[0];

            if (file.fileEntry)
                file.fileEntry['file'](this.loadFileContent.bind(this));
            else
                this.loadFileContent(file);
        }
    }

    getColumnsMappingSuggestions(callback) {
        this._importProxy.getMappedFields(this.fileData.data[0].filter(Boolean)).subscribe(callback);
    }

    checkFileHeaderAvailability() {
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
    }

    buildMappingDataSource() {
        return new Promise((resolve, reject) => {
            if (this.fileData && this.fileData.data && this.fileData.data.length) {
                this.checkFileHeaderAvailability();
                let createDataSourceInternal = (mappingSuggestions = []) => {
                    let noNameCount = 0,
                        data = this.fileData.data[0].map((field, index) => {
                            let fieldId, suggestionField = _.findWhere(mappingSuggestions, {inputFieldName: field});
                            return {
                                id: index,
                                sourceField: field || this.l('NoName', [++noNameCount]),
                                sampleValue: this.lookForValueExample(index),
                                mappedField: field ? (this.lookupFields.every((item) => {
                                    let isSameField = suggestionField ? suggestionField.outputFieldName == item.id :
                                        (item.id.split(ImportWizardComponent.FieldSeparator).pop().toLowerCase()
                                            .indexOf(field.replace(/\s|_/g, '').toLowerCase()) >= 0);
                                    if (isSameField)
                                        fieldId = item.id;
                                    return !isSameField;
                                }) ? '' : fieldId) : undefined
                            };
                        });

                    this.mapDataSource = {
                        store: {
                            type: 'array',
                            key: 'id',
                            data: data
                        }
                    };

                    let selectedMapRowKeys = [];
                    data.forEach(v => {
                        if (v.mappedField)
                            selectedMapRowKeys.push(v.id);
                    });
                    this.selectedMapRowKeys = selectedMapRowKeys;
                    resolve();
                };

                if (this.fileHeaderWasGenerated)
                    createDataSourceInternal();
                else this.getColumnsMappingSuggestions((res) => {
                    createDataSourceInternal(res);
                });

            } else
                resolve();
        });
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
            this.fileDropped({ files: $event.target.files });
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
        if ($event.newData.mappedField) {
            $event.component.selectRows([$event.key], true);
            this.mapDataSource.store.data.forEach((row) => {
                if ($event.oldData.sourceField != row.sourceField &&
                    $event.newData.mappedField && $event.newData.mappedField == row.mappedField) {
                    $event.isValid = false;
                    $event.errorText = this.l('FieldMapError', [row.sourceField]);
                }
            });
        } else
            $event.component.deselectRows([$event.key]);

        if ($event.isValid)
            this.mapGrid.instance.closeEditCell();
    }

    selectionModeChanged($event) {
        this.reviewGrid.instance.option(
            'selection.selectAllMode', $event.itemData.mode);
    }

    onMapCellClick($event) {
        if (typeof ($event.displayValue) === 'boolean') {
            $event.component.deselectRows([$event.data.id]);
            $event.data.mappedField = '';
        }
    }

    onMapSelectionChanged($event) {
        let rowIdsToDeselect = [];
        $event.selectedRowsData.forEach((row) => {
            if (!row.mappedField)
                rowIdsToDeselect.push(row.id);
        });

        $event.component.deselectRows(rowIdsToDeselect);
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
        let partsCapitalized = parts.map(p => capitalize(p));
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
                column.calculateDisplayValue = this.calculateDisplayValue;
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

    validateRowFields(data) {
        this.validateFieldList.forEach((fld) => {
            Object.keys(data).forEach((field) => {
                if (field.toLowerCase().includes(fld) &&
                    !this.checkFieldValid(fld, {value: data[field]})
                )
                    this.addInvalidField(data.uniqueIdent, field);
            });
        });
    }

    addInvalidField(key, field) {
        let invalidRowFields = this.invalidRowKeys[key];
        if (invalidRowFields && invalidRowFields.indexOf(field) < 0)
            invalidRowFields.push(field);
        else
            this.invalidRowKeys[key] = [field];
    }

    checkFieldValid(field, dataCell) {
        let value = dataCell.value;
        if (field == 'phone')
            return this._phoneNumberService.isPhoneNumberValid(value);
        else if (field == 'annualRevenue')
            return !value || !isNaN(parseFloat(value));
        else
            return !value || AppConsts.regexPatterns[field].test(value);
    }

    calculateDisplayValue(data) {
        const MAX_LEN = 80;
        let value = data[this['dataField']];
        if (value && value.length > MAX_LEN)
            return value.substr(0, MAX_LEN) + '...';
        return value;
    }

    onReviewCellPrepared($event) {
        if ($event.data && $event.data.highliteFields &&
            $event.data.highliteFields.indexOf($event.value) >= 0
        ) $event.cellElement.classList.add('bold');
    }

    selectedStepChanged(event) {
        this.onSelectionChanged.emit(event);
        if (event)
            this.selectedStepIndex = event.selectedIndex;
    }
}

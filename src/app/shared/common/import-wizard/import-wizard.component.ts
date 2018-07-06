import { Component, Injector, Input, Output, EventEmitter, ViewChild, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppComponentBase } from '@shared/common/app-component-base';
import { MatHorizontalStepper } from '@angular/material';
import { PapaParseService } from 'ngx-papaparse';
import { UploadEvent, UploadFile } from 'ngx-file-drop';
import { AppService } from '@app/app.service';

import { DxDataGridComponent } from 'devextreme-angular';

import * as _ from 'underscore';
import * as _s from 'underscore.string';

@Component({
    selector: 'import-wizard',
    templateUrl: 'import-wizard.component.html',
    styleUrls: ['import-wizard.component.less']
})
export class ImportWizardComponent extends AppComponentBase implements OnInit{
    @ViewChild(MatHorizontalStepper) stepper: MatHorizontalStepper;
    @ViewChild('mapGrid') mapGrid: DxDataGridComponent;
    @ViewChild('reviewGrid') reviewGrid: DxDataGridComponent;
    @ViewChild('importFileInput') dataFromInput: any;

    @Input() title: string;
    @Input() icon: string;
    @Input() checkSimilarRecord: Function;
    @Input() columnsConfig: any = {};
    @Input() localizationSource: string;
    @Input() lookupFields: any;
    @Input() preProcessFieldBeforeReview: Function;
    @Input() validateFieldsMapping: Function;
    @Input() toolbarConfig: any[];

    @Output() onCancel: EventEmitter<any> = new EventEmitter();
    @Output() onComplete: EventEmitter<any> = new EventEmitter();
    @Output() userAssign: EventEmitter<any> = new EventEmitter();
    @Output() listsSelect: EventEmitter<any> = new EventEmitter();
    @Output() ratingSelect: EventEmitter<any> = new EventEmitter();
    @Output() starSelect: EventEmitter<any> = new EventEmitter();
    @Output() tagsSelect: EventEmitter<any> = new EventEmitter();


    public static readonly FieldSeparator = '_';

    uploadFile: FormGroup;
    dataMapping: FormGroup;

    private files: UploadFile[] = [];
    private duplicateCounts: any = {};
    private reviewGroups: any = [];

    private readonly UPLOAD_STEP_INDEX  = 0;
    private readonly MAPPING_STEP_INDEX = 1;
    private readonly REVIEW_STEP_INDEX  = 2;
    private readonly FINISH_STEP_INDEX  = 3;

    showSteper: boolean = true;
    loadProgress: number = 0;
    dropZoneProgress: number = 0;

    fileData: any;
    fileName: string = '';
    fileSize: string = '';
    fileHasHeader: boolean = false;
    fileHeaderWasGenerated = false;

    selectedPreviewRows: any = [];

    reviewDataSource: any;
    mapDataSource: any;

    isMapped = true;

    selectModeItems = [
        {text: 'Affect on page items', mode: 'page'},
        {text: 'Affect all pages items', mode: 'allPages'}
    ]

    constructor(
        injector: Injector,
        private _parser: PapaParseService,
        private _appService: AppService,
        private _formBuilder: FormBuilder
    ) { 
        super(injector);

        this.uploadFile = _formBuilder.group({
            url: ['', Validators.pattern(/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/)],
            valid: ['', () => {
                return this.checkFileDataValid() ? null: { 'required': true };
            }]
        });
        this.dataMapping = _formBuilder.group({
            valid: ['', () => {
                let validationResult = null;
                if (this.validateFieldsMapping)
                    validationResult = _.extend(this.validateFieldsMapping(this.getMappedFields()), { 'required': true });
                return validationResult && validationResult.isMapped && !validationResult.error ? null: validationResult;
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
            let data = this.reviewGrid.instance.getSelectedRowsData();
            this.complete(data.length && data || this.reviewDataSource);
        }
    }

    getMappedFields() {
        let mappedFields = this.mapGrid.instance.getSelectedRowsData();
        if (!mappedFields.length) {
            mappedFields = this.mapDataSource.store.data.filter((row) => {
                return !!row.mappedField;
            });
        }
        return mappedFields;
    }

    cancel() {        
        this.reset(() => {
            this.onCancel.emit();
        });
    }

    complete(data) {
        this.onComplete.emit(data);
    }

    showFinishStep() {
        this.stepper.selectedIndex = this.FINISH_STEP_INDEX;
    }

    emptyReviewData() {
        this.reviewDataSource = [];
        this.selectedPreviewRows = [];
        this.duplicateCounts = {};
        this.reviewGroups = [];
    }

    initReviewDataSource(mappedFields) {
        let columnsIndex = {};
        this.emptyReviewData();

        this.fileData.data.map((row, index) => {
            if (index) {                
                if (row.length == Object.keys(columnsIndex).length) {
                    let data = {};
                    mappedFields.forEach((field) => {
                        let rowValue = row[columnsIndex[field.sourceField]];
                        if (
                            (!this.preProcessFieldBeforeReview || !this.preProcessFieldBeforeReview(field, rowValue, data)) 
                            && 
                            !data[field.mappedField]
                        )
                            data[field.mappedField] = rowValue;
                    });
                    if (this.checkDuplicate(data))
                        delete this.fileData.data[index];
                    else
                        return data;
                }
            } else 
                row.forEach((item, index) => {
                    columnsIndex[item] = index;
                });            
        }).forEach((row, index) => {
            row && this.reviewDataSource.push(
                this.checkSimilarGroups(row));
        });

        let groups = this.reviewGroups.filter(Boolean);
        this.reviewGroups = [];
        groups.forEach((group, index) => {
            if (group && group.length) {
                if (group.length > 1) {
                    let groupName = this.l('Similar items') + 
                        '(' + group[0].compared + ')';
                    this.reviewGroups.push(groupName);
                    group.forEach((item) => {
                        item.compared = groupName;
                    });
                } else
                    group[0].compared = this.l('Unique item(s)');
                this.selectedPreviewRows.push(group[0].uniqueIdent);
            }
        });
    }

    getRowUniqueIdent(row) {
        return JSON.stringify(row)
            .toLowerCase().split('').reduce(
                (prev, next) => {
                    return ((prev << 5) - prev) + 
                        next.charCodeAt(0);                    
                }, 0).toString();
    }

    checkDuplicate(row) {
        let ident = this.getRowUniqueIdent(row),      
            count = this.duplicateCounts[ident];

        row.uniqueIdent = ident;
        return (this.duplicateCounts[ident] = 
            (count || 0) + 1) > 1;
    }

    checkSimilarGroups(row) {
        if (this.reviewGroups.length) {
            let groupIndex = [];
            this.reviewGroups.forEach((group, index) => {                
                if (group && group.some((item) => {
                    return this.checkSimilarRecord(row, item);
                })) groupIndex.push(index);                
            });
  
            if (groupIndex.length) {
                if (groupIndex.length > 1) {
                    let newGroup = [];
                    groupIndex.forEach((index) => {
                        newGroup = newGroup.concat(this.reviewGroups[index]);
                        delete this.reviewGroups[index];
                    });
                    this.reviewGroups.push(newGroup);
                } else
                    this.reviewGroups[groupIndex[0]].push(row);

                return row;
            }
        } 
        this.reviewGroups.push([row]);

        return row;
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
            }
            else if (this.fileHasHeader && this.fileHeaderWasGenerated) {
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
            const constNames = ['Name', 'Email', 'Phone'];
            let fileHasHeader = true;

            for (let i = 0; i < constNames.length; i++) {
                let nameIsPresent = false;
                this.fileData.data[0].forEach((val: string) => {
                    if (val.indexOf(constNames[i]) != -1)
                        nameIsPresent = true;
                });
                if (!nameIsPresent) {
                    fileHasHeader = false;
                    break;
                }
            }

            this.fileHasHeader = fileHasHeader;
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
            this.fileDropped({files: $event.target.files})
    }

    downloadFromURL() {
        if (!this.uploadFile.invalid) {
            let url = this.uploadFile.value.url;
            if (url)
                this.getFile(url, (result) => {
                    if (result.target.status == 200) {
                        this.fileName = url.split('?')[0].split('/').pop();
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
        request.addEventListener("load", (event) => {
            this.loadProgress = 101;
            callback(event);
        });
        request.addEventListener("progress", (event) => {
            if (event.total > event.loaded)
                this.loadProgress = Math.round(event.loaded / event.total * 100);
        });
        request.open('GET', path, true);
        request.setRequestHeader('Accept', "*/*");
        request.setRequestHeader('Content-Type', "application/*");

        request.send();
    }

    onRowValidating($event) {
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
        if (this.mapGrid && !this.isMapped) {
            let mappedFields = this.mapGrid.instance.getSelectedRowsData();
            this.highlightUnmappedFields(mappedFields);
        }
    }

    onLookupFieldsContentReady($event, cell) {
        $event.component.unselectAll();
        $event.component.selectItem(cell.value);
    }

    customizePreviewColumns = (columns) => {
        columns.forEach((column) => {
            let columnConfig = this.columnsConfig[column.dataField];
            if (column.dataField == 'uniqueIdent')
                column.visible = false;
            else if (column.dataField == 'compared') {
                if (this.reviewGroups.length)
                    column.groupIndex = 0;
                else {
                    column.visible = false;
                    this.selectedPreviewRows = [];
                }
            } else {
                if (columnConfig)
                    _.extend(column, columnConfig);
            }

            if (!columnConfig || !columnConfig['caption'])
                column.caption = _s.humanize(column.dataField.split(
                    ImportWizardComponent.FieldSeparator).pop());
        });
    }
}
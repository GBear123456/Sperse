import { Component, Injector, Input, Output, EventEmitter, ViewChild, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppComponentBase } from '@shared/common/app-component-base';
import { MatHorizontalStepper } from '@angular/material';
import { Papa } from 'ngx-papaparse';
import { UploadFile } from 'ngx-file-drop';
import { DxDataGridComponent } from 'devextreme-angular';

@Component({
    selector: 'import-wizard',
    templateUrl: 'import-wizard.component.html',
    styleUrls: ['import-wizard.component.less']
})
export class ImportWizardComponent extends AppComponentBase implements OnInit {
    @ViewChild(MatHorizontalStepper) stepper: any;
    @ViewChild('mapGrid') mapGrid: DxDataGridComponent;
    @ViewChild('reviewGrid') reviewGrid: DxDataGridComponent;

    @Input() title: string;
    @Input() localizationSource: string;

    @Input()
    set fields(list: string[]) {
        this.lookupFields = list.map((field) => {
            return {
                id: field,
                name: this.capitalize(field)
            };
        });
    }

    @Output() onCancel: EventEmitter<any> = new EventEmitter();
    @Output() onComplete: EventEmitter<any> = new EventEmitter();

    uploadFile: FormGroup;

    private files: UploadFile[] = [];

    private readonly UPLOAD_STEP_INDEX = 0;
    private readonly MAPPING_STEP_INDEX = 1;
    private readonly REVIEW_STEP_INDEX = 2;
    private readonly FINISH_STEP_INDEX = 3;

    showSteper = true;
    loadProgress = 0;
    dropZoneProgress = 0;

    fileData: any;
    fileName = '';
    fileSize = '';

    reviewDataSource: any;
    mapDataSource: any;
    lookupFields: any;

    selectModeItems = [
        {text: 'Affect on page items', mode: 'page'},
        {text: 'Affect all pages items', mode: 'allPages'}
    ];

    constructor(injector: Injector,
                private _parser: Papa,
                private _formBuilder: FormBuilder) {
        super(injector);
        this.uploadFile = _formBuilder.group({
            url: ['', Validators.pattern(/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/)]
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
        setTimeout(() => {
            this.showSteper = true;
            callback && callback();
        });
    }

    next() {
        if (this.stepper.selectedIndex == this.UPLOAD_STEP_INDEX) {
            if (this.checkFileDataValid())
                this.stepper.next();
            else
                this.message.error(this.l('ChooseCorrectCSV'));
        } else if (this.stepper.selectedIndex == this.MAPPING_STEP_INDEX) {
            let mappedFields = this.mapGrid.instance.getSelectedRowsData();
            if (!mappedFields.length) {
                mappedFields = this.mapDataSource.filter((row) => {
                    return !!row.mappedField;
                });
            }
            if (this.validateFieldsMapping(mappedFields))
                this.initReviewDataSource(mappedFields);
        } else if (this.stepper.selectedIndex == this.REVIEW_STEP_INDEX) {
            let data = this.reviewGrid.instance.getSelectedRowsData();
            this.complete(data.length && data || this.reviewDataSource);
        }
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

    initReviewDataSource(mappedFields) {
        let columnsIndex = {};
        this.reviewDataSource = [];
        this.fileData.data.forEach((row, index) => {
            if (index) {
                if (row.length == Object.keys(columnsIndex).length) {
                    let data = {};
                    mappedFields.forEach((field) => {
                        data[field.mappedField] = row[columnsIndex[field.sourceField]];
                    });
                    this.reviewDataSource.push(data);
                }
            } else
                row.forEach((item, index) => {
                    columnsIndex[item] = index;
                });
        });

        this.stepper.next();
    }

    validateFieldsMapping(rows) {
        const FIRST_NAME_FIELD = 'first',
            LAST_NAME_FIELD = 'last';
        let isFistName = false,
            isLastName = false,
            isMapped = rows.every((row) => {
                isFistName = isFistName || (row.mappedField.toLowerCase() == FIRST_NAME_FIELD);
                isLastName = isLastName || (row.mappedField.toLowerCase() == LAST_NAME_FIELD);
                if (!row.mappedField)
                    this.message.error(this.l('MapAllRecords'));
                return !!row.mappedField;
            });

        if (isMapped && (!isFistName || !isLastName))
            this.message.error(this.l('FieldsMapError'));

        return isMapped && isFistName && isLastName;
    }

    checkFileDataValid() {
        return this.fileData && !this.fileData.errors.length
            && this.fileData.data.length;
    }

    parse(content) {
        this._parser.parse(content.trim(), {
            complete: (results) => {
                if (results.errors.length)
                    this.message.error(results.errors[0].message);
                else {
                    this.fileData = results;
                    this.buildMappingDataSource();
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
        this.mapDataSource =
            this.fileData.data[0].map((field, index) => {
                let fieldId;
                return {
                    sourceField: field,
                    sampleValue: this.lookForValueExample(index),
                    mappedField: this.lookupFields.every((item) => {
                        let isSameField = item.id.toLowerCase() == field.toLowerCase();
                        if (isSameField)
                            fieldId = item.id;
                        return !isSameField;
                    }) ? '' : fieldId
                };
            });
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
        this.mapDataSource.forEach((row) => {
            if ($event.newData.sourceField != row.sourceField
                && $event.newData.mappedField == row.mappedField
            ) {
                $event.isValid = false;
                $event.errorText = this.l('FieldMappedError', [row.sourceField]);
            }
        });
    }

    selectionModeChanged($event) {
        this.reviewGrid.instance.option(
            'selection.selectAllMode', $event.itemData.mode);
    }
}

import { Component, Injector, Input, Output, EventEmitter, ViewChild, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppComponentBase } from '@shared/common/app-component-base';
import { MatHorizontalStepper } from '@angular/material';
import { PapaParseService } from 'ngx-papaparse';
import { UploadEvent, UploadFile } from 'ngx-file-drop';

import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';

import { DxDataGridComponent } from 'devextreme-angular';

@Component({
    selector: 'import-wizard',
    templateUrl: 'import-wizard.component.html',
    styleUrls: ['import-wizard.component.less']
})
export class ImportWizardComponent extends AppComponentBase implements OnInit{
    @ViewChild(MatHorizontalStepper) stepper: MatHorizontalStepper;
    @ViewChild('mapGrid') mapGrid: DxDataGridComponent;
    @ViewChild('reviewGrid') reviewGrid: DxDataGridComponent;

    @Input() title: string;
    @Input() imported: boolean;
    @Input() localizationSource: string;
    @Input() set fields(list: string[]) {
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

    private readonly UPLOAD_STEP_INDEX  = 0;
    private readonly MAPPING_STEP_INDEX = 1;
    private readonly REVIEW_STEP_INDEX  = 2;

    showSteper: boolean = true;
    loadProgress: number = 0;
    dropZoneProgress: number = 0;

    fileData: any;
    fileName: string = '';
    fileSize: string = '';

    reviewDataSource: any;
    mapDataSource: any;
    lookupFields: any;

    constructor(
        injector: Injector,
        private _parser: PapaParseService,
        private _formBuilder: FormBuilder
    ) { 
        super(injector);

        this.uploadFile = _formBuilder.group({
          url: ['', Validators.pattern(/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/)]
        });
    }

    ngOnInit() {  
        this.localizationSourceName = this.localizationSource;
    }

    reset(callback = null) { 
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
            let selected = this.mapGrid.instance.getSelectedRowsData();
            if (selected.length) {
                if (this.validateFieldsMapping(selected))
                    this.initReviewDataSource(selected);
            } else {
                let mappedFields = this.mapDataSource.filter((row) => {
                    return !!row.mappedField;
                });
                if (this.validateFieldsMapping(mappedFields))
                    this.initReviewDataSource(mappedFields); 
            }
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

    initReviewDataSource(mappedFields) {        
        let columnsIndex = {};
        this.reviewDataSource = this.fileData.data.map((row, index) => {
            if (index) {
                let data = {};
                mappedFields.forEach((field) => {
                    data[field.mappedField] = row[columnsIndex[field.sourceField]];
                });
                return data;
            } else 
                row.forEach((item, index) => {
                    columnsIndex[item] = index;
                });
        });

        this.stepper.next();
    }

    validateFieldsMapping(rows) {
        let isFistName = false, 
            isLastName = false,
            isMapped = rows.every((row) => {
                isFistName = isFistName || (row.mappedField == 'first');
                isLastName = isLastName || (row.mappedField == 'last');
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
        this._parser.parse(content, {
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
 
    loadFileContent(file) {
        this.loadProgress = 0;
        this.fileName = file.name;
        this.fileSize = (file.size / 1024).toFixed(2) + 'KB';
        let reader = new FileReader();
        reader.onload = (event) => {
            this.dropZoneProgress = 100;
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
                let fieldId = field.toLowerCase();
                return {
                  sourceField: field,
                  sampleValue: this.fileData.data[1][index],
                  mappedField: this.lookupFields.every(
                      (item) => item.id.toLowerCase() != fieldId) ? '': fieldId
                };
            });
    }
   
    fileSelected($event) {
        if ($event.target.files.length)
            this.fileDropped({files: $event.target.files})
    }

    downloadFromURL() {
        if (!this.uploadFile.invalid) {
            if (this.uploadFile.value.url)
                this.getFile(this.uploadFile.value.url, (result) => {
                    if (result.target.status == 200) {
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
            this.loadProgress = 100;
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
        this.mapDataSource.forEach((row) => {
            if ($event.newData.sourceField != row.sourceField 
                && $event.newData.mappedField == row.mappedField
            ) {
                $event.isValid = false;
                $event.errorText = this.l('FieldMappedError', [row.sourceField]);
            }
        });
    }
}
import { Component, Injector, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppComponentBase } from '@shared/common/app-component-base';
import { MatHorizontalStepper } from '@angular/material';
import { PapaParseService } from 'ngx-papaparse';
import { UploadEvent, UploadFile } from 'ngx-file-drop';

@Component({
    selector: 'import-wizard',
    templateUrl: 'import-wizard.component.html',
    styleUrls: ['import-wizard.component.less']
})
export class ImportWizardComponent extends AppComponentBase {
    @ViewChild(MatHorizontalStepper) stepper: MatHorizontalStepper;

    @Input() title: string;
    @Input() imported: boolean;

    @Output() onCancel: EventEmitter<any> = new EventEmitter();
    @Output() onComplete: EventEmitter<any> = new EventEmitter();

    uploadFile: FormGroup;
    dataMapping: FormGroup;

    lastStep: boolean;

    private files: UploadFile[] = [];
    private readonly STEP_COUNT = 3; 

    showSteper: boolean = true;
    loadProgress: number = 0;
    dropZoneProgress: number = 0;

    fileData: any;
    fileName: string = '';
    fileSize: string = '';

    constructor(
        injector: Injector,
        private _parser: PapaParseService,
        private _formBuilder: FormBuilder
    ) { 
        super(injector);

        this.uploadFile = _formBuilder.group({
          url: ['', Validators.pattern(/((([A-Za-z]{3,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/)]
        });
        this.dataMapping = _formBuilder.group({
          secondCtrl: ['', Validators.required]
        });
    }

    stepChanged($event) {
        this.lastStep = ($event.selectedIndex >= this.STEP_COUNT - 1);
    }

    reset() { 
        this.showSteper = false;
        this.lastStep = false;

        this.uploadFile.reset();
        this.dataMapping.reset();

        setTimeout(() => {
            this.showSteper = true;
        });
    }

    cancel() {
        this.onCancel.emit();
    }

    complete() {
        this.onComplete.emit();
    }

    parse(content) {
        this._parser.parse(content, {
            complete: (results) => {
                if (results.errors.length)
                    this.message.error(results.errors[0].message);
                else {
                    this.fileData = results;
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
   
    fileSelected($event) {
        if ($event.target.files.length)
            this.fileDropped({files: $event.target.files})
    }

    downloadFromURL() {
        if (!this.uploadFile.invalid)
            this.getFile(this.uploadFile.value.url, (result) => {
                if (result.target.status == 200) {
                    this.parse(result.target.responseText);
                } else {
                    this.message.error(result.target.statusText);
                }
            });
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
}
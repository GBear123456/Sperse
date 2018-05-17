import { Component, Injector, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppComponentBase } from '@shared/common/app-component-base';
import { MatHorizontalStepper } from '@angular/material';

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

    private readonly STEP_COUNT = 3; 

    constructor(
        injector: Injector,
        private _formBuilder: FormBuilder
    ) { 
        super(injector);

        this.uploadFile = _formBuilder.group({
          firstCtrl: ['', Validators.required]
        });
        this.dataMapping = _formBuilder.group({
          secondCtrl: ['', Validators.required]
        });
    }

    stepChanged($event) {
        this.lastStep = ($event.selectedIndex >= this.STEP_COUNT - 1);
    }

    reset() { 
    }

    cancel() {
        this.onCancel.emit();
    }

    complete() {
        this.onComplete.emit();
    }
}
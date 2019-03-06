import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import startCase from 'lodash/startCase';

@Component({
    selector: 'tag-field',
    templateUrl: './tag-field.component.html',
    styleUrls: ['./tag-field.component.less']
})
export class TagFieldComponent implements OnInit {
    @Input() name: string;
    @Input() label;
    @Input() readOnly = false;
    @Input() valueExpr: string;
    @Input() displayExpr: string;
    @Input() dataSource: any;
    @Input() value: string;
    @Output() valueChange: EventEmitter<string> = new EventEmitter<string>();
    constructor(public ls: AppLocalizationService) { }

    ngOnInit() {
        if (!this.label) {
            this.label = startCase(this.name);
        }
    }

}

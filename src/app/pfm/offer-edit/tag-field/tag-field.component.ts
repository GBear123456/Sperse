import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { BaseFieldComponent } from '@app/pfm/offer-edit/base-field/base-field.component';

@Component({
    selector: 'tag-field',
    templateUrl: './tag-field.component.html',
    styleUrls: ['./tag-field.component.less']
})
export class TagFieldComponent extends BaseFieldComponent implements OnInit {
    @Input() valueExpr: string;
    @Input() displayExpr: string;
    @Input() dataSource: any;
    @Input() value: string;
    @Output() valueChange: EventEmitter<string> = new EventEmitter<string>();
    constructor(public ls: AppLocalizationService) {
        super();
    }

    ngOnInit() {
        super.ngOnInit();
    }

}

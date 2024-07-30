/** Core imports */
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    ViewChild,
    Input,
    TemplateRef,
    Output,
    EventEmitter
} from '@angular/core';

/** Third party imports */
import { DxValidationGroupComponent } from 'devextreme-angular/ui/validation-group';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';

@Component({
    selector: 'landing-page-list',
    templateUrl: 'landing-page-list.component.html',
    styleUrls: [
        '../../shared/styles/common.less',
        'landing-page-list.component.less'
    ],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class LandingPageListComponent {
    @ViewChild(DxValidationGroupComponent, { static: false }) validationGroup: DxValidationGroupComponent

    @Input() title: string;
    @Input() list: any[];
    @Input() itemTemplate: TemplateRef<any>;
    @Output() beforeItemAdd: EventEmitter<any> = new EventEmitter();

    constructor(
        public changeDetectorRef: ChangeDetectorRef,
        public ls: AppLocalizationService
    ) {
    }

    addListItem(): void {
        let item = {};
        this.beforeItemAdd.emit(item);
        this.list.push(item);
    }

    removeListItem(index: number): void {
        this.list.splice(index, 1);
    }

    isValid(): boolean {
        return this.validationGroup.instance.validate().isValid;
    }
}
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { AppLocalizationService } from '../../../app/shared/common/localization/app-localization.service';

@Component({
    selector: 'products-dropdown',
    templateUrl: 'products-dropdown.component.html',
    styleUrls: ['products-dropdown.component.less'],
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductsDropdownComponent {
    constructor(
        public ls: AppLocalizationService
    ) {}

    ngOnInit() {}
}
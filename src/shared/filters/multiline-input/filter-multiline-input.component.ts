/** Core imports */
import { Component } from '@angular/core';

/** Third party imports */
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import capitalize from 'underscore.string/capitalize';

/** Application imports */
import { FilterComponent } from '../models/filter-component';
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { FilterMultilineInputModel } from './filter-multiline-input.model';
import { AppService } from "@app/app.service";

@Component({
    templateUrl: './filter-multiline-input.component.html',
    styleUrls: ['./filter-multiline-input.component.less']
})
export class FilterMultilineInputComponent implements FilterComponent {
    items: {
        element: FilterMultilineInputModel;
    };
    apply: (event) => void;
    capitalize = capitalize;
    maxHeight$: Observable<number> = this.appService.toolbarIsHidden$.pipe(
        map((toolbarIsHidden: boolean) => document.body.clientHeight - (toolbarIsHidden ? 108 : 169))
    );

    constructor(
        private appService: AppService,
        public ls: AppLocalizationService
    ) {}
}

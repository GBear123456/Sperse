/** Core imports */
import { Component, ViewChild } from '@angular/core';

/** Application imports */
import { AppLocalizationService } from '@app/shared/common/localization/app-localization.service';
import { SourceContactListComponent } from '@shared/common/source-contact-list/source-contact-list.component';
import { SourceFilterModelBase } from './source-filter.model';
import { SourceContact } from 'shared/common/source-contact-list/source-contact.interface';

@Component({
    selector: 'source-filter',
    templateUrl: './source-filter.component.html',
    styleUrls: ['./source-filter.component.less']
})
export class FilterSourceComponent {
    @ViewChild(SourceContactListComponent) sourceComponent: SourceContactListComponent;
    items: {
        element: SourceFilterModelBase
    };
    apply: (event) => void;

    constructor(
        public ls: AppLocalizationService
    ) {}

    onSourceContactChanged(sourceContact: SourceContact) {
        this.items.element['contact'] = sourceContact;
        this.sourceComponent.toggle();
    }

    hasElementProperty(name: string): Boolean {
        if (this.items && this.items.element)
            return this.items.element.value.some(item => item.property == name);
    }

    clearContact(e) {
        e.preventDefault();
        e.stopPropagation();
        this.items.element['contact'] = null;
    }
}
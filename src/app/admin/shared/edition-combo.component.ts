import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { ComboboxItemDto, EditionServiceProxy } from '@shared/service-proxies/service-proxies';

@Component({
    selector: 'edition-combo',
    template:
    `<select #EditionCombobox
        class="form-control"
        [(ngModel)]="selectedEdition"
        (ngModelChange)="selectedEditionChange.emit($event)"
        [attr.data-live-search]="true">
            <option *ngFor="let edition of editions" [value]="edition.value">{{edition.displayText}}</option>
    </select>`
})
export class EditionComboComponent implements OnInit, AfterViewInit {
    @ViewChild('EditionCombobox', { static: true }) editionComboboxElement: ElementRef;
    @Input() selectedEdition: string = undefined;
    @Output() selectedEditionChange: EventEmitter<string> = new EventEmitter<string>();
    editions: ComboboxItemDto[] = [];

    constructor(
        private editionService: EditionServiceProxy,
    ) {}

    ngOnInit(): void {
        let self = this;
        this.editionService.getEditionComboboxItems(0, true, false).subscribe(editions => {
            this.editions = editions;
            setTimeout(() => {
                $(self.editionComboboxElement.nativeElement).selectpicker('refresh');
            }, 0);
        });
    }

    ngAfterViewInit(): void {
        $(this.editionComboboxElement.nativeElement).selectpicker({
            iconBase: 'famfamfam-flag',
            tickIcon: 'fa fa-check'
        });
    }
}

import {
    Directive,
    Component,
    Injector,
    Input,
    Output,
    EventEmitter,
    ViewContainerRef,
    ComponentFactoryResolver,
    ViewChild
} from '@angular/core';
import { FilterComponent } from './models/filter-component';
import { FilterModel } from './models/filter.model';

@Directive({
    selector: '[ad-host]'
})
export class AdDirective {
    constructor(public viewContainerRef: ViewContainerRef) { }
}

@Component({
    templateUrl: './filter.manager.component.html',
    styleUrls: ['./filter.manager.component.less'],
    selector: 'filter'
})
export class FilterManagerComponent {
    @ViewChild(AdDirective, { static: true }) adHost: AdDirective;

    private _config: FilterModel;
    @Input()
    set config(filter: FilterModel) {
        this.loadComponent(this._config = filter);
    }

    @Output() onApply = new EventEmitter();

    constructor(
        private componentFactoryResolver: ComponentFactoryResolver
    ) {}

    private loadComponent(filter: FilterModel) {
        this.adHost.viewContainerRef.clear();

        let componentRef = <FilterComponent>this.adHost.viewContainerRef.createComponent(
            this.componentFactoryResolver.resolveComponentFactory(filter.component)
        ).instance;

        componentRef.options = filter.options || {};
        componentRef.items = filter.items || {};
        componentRef.apply = (event) => {
            this.onApply.emit(event);
        };
    }
}

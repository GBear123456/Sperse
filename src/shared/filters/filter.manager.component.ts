import { Directive, Component, Injector, Input, Output, EventEmitter, ViewContainerRef, ComponentFactoryResolver, ViewChild  } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FilterComponent, FilterModel } from './filter.model';
import { FiltersService } from '@shared/filters/filters.service';

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
export class FilterManagerComponent extends AppComponentBase {
  @ViewChild(AdDirective) adHost: AdDirective;

  private _config: FilterModel;
  @Input() 
  set config(filter: FilterModel){
    this.loadComponent(this._config = filter);
  } 

	@Output() onApply = new EventEmitter();
	
  constructor(injector: Injector,
      private _componentFactoryResolver: ComponentFactoryResolver,
      private _filtersService: FiltersService
  ) {
    super(injector);
  }

  private loadComponent(filter: FilterModel) {
    this.adHost.viewContainerRef.clear();

    let componentRef = <FilterComponent>this.adHost.viewContainerRef.createComponent(
      this._componentFactoryResolver.resolveComponentFactory(filter.component)
    ).instance;

    componentRef.localizationSourceName = this._filtersService.localizationSourceName;
    componentRef.items = filter.items || {};
    componentRef.apply = (event) => {
      this.onApply.emit(event);
    }
  }  
}

import { Component, Injector, HostBinding } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
  templateUrl: './platform-select.component.html',
	styleUrls: ['./platform-select.component.less'],
  selector: 'platform-select'
})
export class PlatformSelect extends AppComponentBase {
	@HostBinding('class') private cssClass = '';

  constructor(injector: Injector) {
    super(injector);
    
    this.cssClass = this.module.toLowerCase();
  }
  
  module: string = 'CRM';
  modules = ['API', 'CFO', 'CRM', 'Cloud', 'Feeds', 'Forms', 'HR', 'HUB', 'Slice', 'Store'];

  changeModule(event){
  }
}
import { Component, Injector, Input } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { HeadLineConfigModel } from './headline.model';

@Component({
  selector: 'app-headline',
  templateUrl: './headline.component.html',
  styleUrls: ['./headline.component.less']
})
export class HeadLineComponent extends AppComponentBase {
  @Input()
  set config(config: HeadLineConfigModel){
    this.data = config;
  }

  data: HeadLineConfigModel;

  constructor(
    injector: Injector
  ) {
    super(injector);
  }
}

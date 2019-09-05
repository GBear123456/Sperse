import { Component, Input, Injector, ChangeDetectionStrategy } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
  selector: 'app-recommendations',
  templateUrl: './recommendations.component.html',
  styleUrls: ['./recommendations.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class RecommendationsComponent extends AppComponentBase {
  @Input() creditReport;

  constructor(
    injector: Injector
  ) {
    super(injector);
  }

}

import { Component, OnInit, Input, Injector, ChangeDetectionStrategy } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';

@Component({
  selector: 'app-score-factors',
  templateUrl: './score-factors.component.html',
  styleUrls: ['./score-factors.component.less'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ScoreFactorsComponent extends AppComponentBase implements OnInit {
  @Input() creditReport;

  constructor(
    injector: Injector
  ) {
    super(injector);
  }

  ngOnInit() {
  }

}

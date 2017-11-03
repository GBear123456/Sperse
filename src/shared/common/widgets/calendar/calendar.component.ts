import { AppConsts } from '@shared/AppConsts';
import { Component, AfterViewInit, Injector } from '@angular/core';
import { AppComponentBase } from '../../app-component-base';

var JQCalendarInit = require('jquery-calendar');

@Component({
  selector: 'calendar',
  templateUrl: 'calendar.component.html',
  styleUrls: ['calendar.component.less']
})
export class CalendarComponent extends AppComponentBase implements AfterViewInit {
  calendar: any;

  constructor(
    injector: Injector
  ) { 
    super(injector);
  }

  ngAfterViewInit() {
    this.calendar = JQCalendarInit(".calendar", true);
//    this.calendar.data('dateRangePicker').open(0);
  }
}
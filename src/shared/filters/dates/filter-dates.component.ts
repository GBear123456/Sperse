import { Component, Injector, OnInit } from '@angular/core';
import { AppComponentBase } from '@shared/common/app-component-base';
import { FilterComponent } from '../filter.model';

@Component({
  templateUrl: './filter-dates.component.html',
	styleUrls: ['./filter-dates.component.less']
})
export class FilterDatesComponent extends AppComponentBase implements OnInit, FilterComponent {
  items: {};   
	apply: (event) => void;
  
  constructor(injector: Injector) {
    super(injector);
  }
  
  getItems(): string[] {
    return Object.keys(this.items);
  }

  onFocusIn(event) {
      event.component.open();
  }

  getCaretPosition(field) {  
    if (document['selection']) {  
      field.focus();
      let sel = document['selection'].createRange();
      sel.moveStart('character', -field.value.length);
      return sel.text.length;
    } else if (field.selectionStart)
      return field.selectionStart;
    return field.value.length;    
  }

  checkMask(mask: string, value: string){
    return (value + mask.slice(value.length)).match(
      /^(0?[1-9]|1[012])\/(0?[1-9]|[12][0-9]|3[01])\/\d{4}$/
    );
  }

  validateDate(event) {
    var event = event.jQueryEvent.originalEvent,
        value = require('underscore.string/splice')(event.target.value, 
          this.getCaretPosition(event.target), 0, event.key);    

    if (['ArrowRight', 'ArrowLeft', 'Backspace', 'Delete', 'Tab'].indexOf(event.key) >= 0)
      return;

    if (!this.checkMask('11/11/1111', value) &&
      !this.checkMask('1/1/1111', value)
    )
      event.preventDefault();
  }

  ngOnInit(): void {
  }
}

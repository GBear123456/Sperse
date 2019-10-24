import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { OperationsWidgetComponent } from './operations-widget.component';

describe('OperationsWidgetComponent', () => {
  let component: OperationsWidgetComponent;
  let fixture: ComponentFixture<OperationsWidgetComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ OperationsWidgetComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(OperationsWidgetComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});

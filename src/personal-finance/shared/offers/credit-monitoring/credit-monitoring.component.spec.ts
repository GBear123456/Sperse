import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreditMonitoringComponent } from './credit-monitoring.component';

describe('CreditMonitoringComponent', () => {
  let component: CreditMonitoringComponent;
  let fixture: ComponentFixture<CreditMonitoringComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreditMonitoringComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreditMonitoringComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

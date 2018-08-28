import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentPlanChooserComponent } from './payment-plan-chooser.component';

describe('PaymentPlanChooserComponent', () => {
  let component: PaymentPlanChooserComponent;
  let fixture: ComponentFixture<PaymentPlanChooserComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PaymentPlanChooserComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PaymentPlanChooserComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

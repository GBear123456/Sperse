import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentPlanCardComponent } from './payment-plan-card.component';

describe('CardPlaceholderComponent', () => {
  let component: PaymentPlanCardComponent;
  let fixture: ComponentFixture<PaymentPlanCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PaymentPlanCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PaymentPlanCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

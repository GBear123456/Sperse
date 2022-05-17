import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { PaymentWizardComponent } from './payment-wizard.component';

describe('PaymentWizardComponent', () => {
  let component: PaymentWizardComponent;
  let fixture: ComponentFixture<PaymentWizardComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ PaymentWizardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PaymentWizardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

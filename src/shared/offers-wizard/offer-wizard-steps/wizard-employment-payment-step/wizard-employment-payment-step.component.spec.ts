import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WizardEmploymentPaymentStepComponent } from './wizard-employment-payment-step.component';

describe('WizardEmploymentPaymentStepComponent', () => {
  let component: WizardEmploymentPaymentStepComponent;
  let fixture: ComponentFixture<WizardEmploymentPaymentStepComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WizardEmploymentPaymentStepComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WizardEmploymentPaymentStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

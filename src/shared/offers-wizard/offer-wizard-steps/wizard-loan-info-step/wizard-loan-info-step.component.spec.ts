import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WizardLoanInfoStepComponent } from './wizard-loan-info-step.component';

describe('WizardLoanInfoStepComponent', () => {
  let component: WizardLoanInfoStepComponent;
  let fixture: ComponentFixture<WizardLoanInfoStepComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WizardLoanInfoStepComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WizardLoanInfoStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { WizardBankInfoStepComponent } from './wizard-bank-info-step.component';

describe('WizardBankInfoStepComponent', () => {
  let component: WizardBankInfoStepComponent;
  let fixture: ComponentFixture<WizardBankInfoStepComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ WizardBankInfoStepComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WizardBankInfoStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

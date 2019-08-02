import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WizardEmploymentInfoStepComponent } from './wizard-employment-info-step.component';

describe('WizardEmploymentInfoStepComponent', () => {
  let component: WizardEmploymentInfoStepComponent;
  let fixture: ComponentFixture<WizardEmploymentInfoStepComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WizardEmploymentInfoStepComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WizardEmploymentInfoStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WizardContactInfoStepComponent } from './wizard-contact-info-step.component';

describe('WizardContactInfoStepComponent', () => {
  let component: WizardContactInfoStepComponent;
  let fixture: ComponentFixture<WizardContactInfoStepComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WizardContactInfoStepComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WizardContactInfoStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

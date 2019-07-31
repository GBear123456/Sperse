import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WizardPersonalInfoStepComponent } from './wizard-personal-info-step.component';

describe('WizardPersonalInfoStepComponent', () => {
  let component: WizardPersonalInfoStepComponent;
  let fixture: ComponentFixture<WizardPersonalInfoStepComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WizardPersonalInfoStepComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WizardPersonalInfoStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

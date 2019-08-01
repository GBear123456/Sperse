import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WizardHomeInfoStepComponent } from './wizard-home-info-step.component';

describe('WizardHomeInfoStepComponent', () => {
  let component: WizardHomeInfoStepComponent;
  let fixture: ComponentFixture<WizardHomeInfoStepComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WizardHomeInfoStepComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WizardHomeInfoStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

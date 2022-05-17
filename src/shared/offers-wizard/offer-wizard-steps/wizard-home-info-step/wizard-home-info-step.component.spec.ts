import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { WizardHomeInfoStepComponent } from './wizard-home-info-step.component';

describe('WizardHomeInfoStepComponent', () => {
  let component: WizardHomeInfoStepComponent;
  let fixture: ComponentFixture<WizardHomeInfoStepComponent>;

  beforeEach(waitForAsync(() => {
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

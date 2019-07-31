import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WizardCenterModalComponent } from './wizard-center-modal.component';

describe('WizardCenterModalComponent', () => {
  let component: WizardCenterModalComponent;
  let fixture: ComponentFixture<WizardCenterModalComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WizardCenterModalComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WizardCenterModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

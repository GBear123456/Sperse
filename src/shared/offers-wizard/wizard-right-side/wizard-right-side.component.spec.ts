import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { WizardRightSideComponent } from './wizard-right-side.component';

describe('WizardRightSideComponent', () => {
  let component: WizardRightSideComponent;
  let fixture: ComponentFixture<WizardRightSideComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ WizardRightSideComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WizardRightSideComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

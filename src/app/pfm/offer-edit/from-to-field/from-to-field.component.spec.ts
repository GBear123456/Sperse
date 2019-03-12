import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FromToFieldComponent } from './from-to-field.component';

describe('FromToFieldComponent', () => {
  let component: FromToFieldComponent;
  let fixture: ComponentFixture<FromToFieldComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FromToFieldComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FromToFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

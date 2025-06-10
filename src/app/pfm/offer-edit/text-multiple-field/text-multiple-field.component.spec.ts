import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { TextMultipleFieldComponent } from './text-multiple-field.component';

describe('TextMultipleFieldComponent', () => {
  let component: TextMultipleFieldComponent;
  let fixture: ComponentFixture<TextMultipleFieldComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ TextMultipleFieldComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TextMultipleFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

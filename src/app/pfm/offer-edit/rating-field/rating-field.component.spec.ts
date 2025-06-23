import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { RatingFieldComponent } from './rating-field.component';

describe('RatingFieldComponent', () => {
  let component: RatingFieldComponent;
  let fixture: ComponentFixture<RatingFieldComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ RatingFieldComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RatingFieldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

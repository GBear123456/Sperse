import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CreditLinesComponent } from './credit-lines.component';

describe('CreditLinesComponent', () => {
  let component: CreditLinesComponent;
  let fixture: ComponentFixture<CreditLinesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CreditLinesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreditLinesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});

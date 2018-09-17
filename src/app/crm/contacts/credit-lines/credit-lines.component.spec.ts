import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreditLinesComponent } from './credit-lines.component';

describe('CreditLinesComponent', () => {
  let component: CreditLinesComponent;
  let fixture: ComponentFixture<CreditLinesComponent>;

  beforeEach(async(() => {
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

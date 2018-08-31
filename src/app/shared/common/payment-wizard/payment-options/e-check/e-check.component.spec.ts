import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ECheckComponent } from './e-check.component';

describe('ECheckComponent', () => {
  let component: ECheckComponent;
  let fixture: ComponentFixture<ECheckComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ECheckComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ECheckComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

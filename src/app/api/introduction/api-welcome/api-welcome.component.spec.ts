import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ApiWelcomeComponent } from './api-welcome.component';

describe('ApiWelcomeComponent', () => {
  let component: ApiWelcomeComponent;
  let fixture: ComponentFixture<ApiWelcomeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ApiWelcomeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApiWelcomeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

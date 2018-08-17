import {async, ComponentFixture, TestBed} from '@angular/core/testing';

import {NgxNoodelComponent} from './ngx-noodel.component';


describe('NgxNoodelComponent', () => {
  let component: NgxNoodelComponent;
  let fixture: ComponentFixture<NgxNoodelComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [NgxNoodelComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NgxNoodelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

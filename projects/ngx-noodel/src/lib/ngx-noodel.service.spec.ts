import {inject, TestBed} from '@angular/core/testing';

import {NgxNoodelService} from './ngx-noodel.service';


describe('NgxNoodelService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NgxNoodelService]
    });
  });

  it('should be created', inject([NgxNoodelService], (service: NgxNoodelService) => {
    expect(service).toBeTruthy();
  }));
});

import {
  ChangeDetectorRef,
  OnDestroy,
  Pipe,
  PipeTransform,
  WrappedValue,
  ɵisObservable as isObservable,
  ɵisPromise as isPromise
} from '@angular/core';

import {from, Observable, Subscription} from 'rxjs';


function canSubscribe(obj: any): boolean {
  return isObservable(obj) || isPromise(obj);
}

function asObservable<T>(source: Promise<T> | Observable<T>): Observable<T> {
  if (isPromise(source)) {
    return from(source as Promise<T>);
  }
  if (isObservable(source)) {
    return source;
  }
  throw new Error('Invalid source');
}

export type RsAsyncInput<T> = T | Promise<T> | Observable<T>;

@Pipe({name: 'rsAsync', pure: false})
export class RsAsyncPipe<T> implements PipeTransform, OnDestroy {
  private localNext: T;
  private localResult: T;
  private localEmitter: Promise<T> | Observable<T>;

  private currentSubscription = Subscription.EMPTY;

  constructor(private changeDetector: ChangeDetectorRef) {
  }

  public transform(value: RsAsyncInput<T>, defaultValue?: T): T | WrappedValue {
    if (canSubscribe(value)) {
      if (this.localEmitter !== value) {
        this.localEmitter = value as Promise<T> | Observable<T>;

        this.currentSubscription.unsubscribe();
        this.currentSubscription = asObservable(this.localEmitter)
          .subscribe(
            next => {
              this.localNext = next;
              this.changeDetector.markForCheck();
            },
            err => {
              throw err;
            }
          );

        if (defaultValue !== void 0) {
          this.localNext = defaultValue;
        }

        this.localResult = this.localNext;
        return this.localResult;
      }

      if (this.localResult === this.localNext) {
        return this.localResult;
      }
      this.localResult = this.localNext;
      return WrappedValue.wrap(this.localResult);
    }

    if (this.localResult === value) {
      return this.localResult;
    }

    this.localResult = value as T;
    return WrappedValue.wrap(this.localResult);
  }

  public ngOnDestroy(): void {
    this.currentSubscription.unsubscribe();
  }
}

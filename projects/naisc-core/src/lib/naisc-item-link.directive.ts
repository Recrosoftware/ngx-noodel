import {ChangeDetectorRef, Directive, DoCheck, HostBinding, Input, OnChanges, SimpleChanges} from '@angular/core';
import {ViewProjection} from './internal/models';

import {NAISC_PIN_POSITION} from './internal/symbols';

import {NaiscPinDescriptor} from './shared/naisc-item-descriptor';


@Directive({
  selector: 'path[naiscItemLink]'
})
export class NaiscItemLinkDirective implements OnChanges, DoCheck {
  @Input() public sourcePin: NaiscPinDescriptor & { [NAISC_PIN_POSITION]: ViewProjection };
  @Input() public targetPin: NaiscPinDescriptor & { [NAISC_PIN_POSITION]: ViewProjection };
  @Input() public targetPosition: ViewProjection;

  @HostBinding('attr.d')
  public pathData: string;

  private localSourcePosition: ViewProjection;
  private localTargetPosition: ViewProjection;

  constructor(private changeDetector: ChangeDetectorRef) {
  }

  public ngOnChanges(changes: SimpleChanges): void {
    if ('sourcePin' in changes) {
      if (this.sourcePin) {
        this.localSourcePosition = this.sourcePin[NAISC_PIN_POSITION];
      } else {
        this.localSourcePosition = null;
      }
    }

    if ('targetPin' in changes) {
      if (this.targetPin) {
        this.localTargetPosition = this.targetPin[NAISC_PIN_POSITION];
      } else {
        this.localTargetPosition = null;
      }
    }

    this.render();
  }

  public ngDoCheck(): void {
    let mustRender = false;

    if (this.sourcePin && this.sourcePin[NAISC_PIN_POSITION] !== this.localSourcePosition) {
      this.localSourcePosition = this.sourcePin[NAISC_PIN_POSITION];
      mustRender = true;
    }

    if (this.targetPin && this.targetPin[NAISC_PIN_POSITION] !== this.localTargetPosition) {
      this.localTargetPosition = this.targetPin[NAISC_PIN_POSITION];
      mustRender = mustRender || !this.targetPosition;
    }

    if (mustRender) {
      this.render();
    }
  }

  private render(): void {
    const oldPath = this.pathData;

    this.pathData = '';

    const source = this.localSourcePosition;
    const target = this.targetPosition || this.localTargetPosition;

    if (source && target) {
      let diff = (target.x - source.x) * .4;

      if (diff < 0) {
        diff /= -.3;
      }

      this.pathData = `M ${source.x} ${source.y} C ${source.x + diff} ${source.y} ${target.x - diff} ${target.y} ${target.x} ${target.y}`;
    }

    if (this.pathData !== oldPath) {
      this.changeDetector.markForCheck();
    }
  }
}

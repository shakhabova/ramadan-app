import { Component, input, output } from '@angular/core';
import { Pressable, Text, View } from '@ng-native/components';

/** A label and a −/+ stepper for a whole hour, used for every reminder time. */
@Component({
  selector: 'app-hour-field',
  imports: [Pressable, Text, View],
  template: `
    <view class="field">
      <text class="label">{{ label() }}</text>
      <view class="stepper">
        <pressable class="step" accessibilityRole="button" [accessibilityLabel]="label() + ' −'" (press)="dec()">
          <text class="step-text">−</text>
        </pressable>
        <text class="value">{{ hour() }}:00</text>
        <pressable class="step" accessibilityRole="button" [accessibilityLabel]="label() + ' +'" (press)="inc()">
          <text class="step-text">+</text>
        </pressable>
      </view>
    </view>
  `,
  styles: `
    .field { min-height: 48px; flex-direction: row; justify-content: space-between; align-items: center; gap: 8px; }
    .label { font-size: 14px; color: #b5beb6; flex: 1; }
    .stepper { flex-direction: row; align-items: center; gap: 8px; }
    .step {
      width: 36px;
      height: 36px;
      border-radius: 18px;
      align-items: center;
      justify-content: center;
      background-color: #1a2a25;
      border-color: #314038;
      border-width: 1px;
    }
    .step-text { font-size: 19px; font-weight: 600; color: #e3d3ae; }
    .value { font-size: 15px; font-weight: 600; color: #f3ecdf; min-width: 48px; text-align: center; }
  `,
})
export class HourField {
  readonly label = input.required<string>();
  readonly hour = input.required<number>();
  readonly min = input(0);
  readonly max = input(23);
  readonly changed = output<number>();

  protected dec(): void {
    this.changed.emit(Math.max(this.min(), this.hour() - 1));
  }

  protected inc(): void {
    this.changed.emit(Math.min(this.max(), this.hour() + 1));
  }
}

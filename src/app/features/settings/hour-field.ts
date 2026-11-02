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
        <pressable
          class="step"
          accessibilityRole="button"
          [accessibilityLabel]="label() + ' −'"
          (press)="dec()"
        >
          <text class="step-text">−</text>
        </pressable>
        <text class="value">{{ hour() }}:00</text>
        <pressable
          class="step"
          accessibilityRole="button"
          [accessibilityLabel]="label() + ' +'"
          (press)="inc()"
        >
          <text class="step-text">+</text>
        </pressable>
      </view>
    </view>
  `,
  styles: `
    .field {
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
    }
    .label {
      font-size: 14px;
      color: #4a5a51;
      flex: 1;
    }
    .stepper {
      flex-direction: row;
      align-items: center;
      gap: 10px;
    }
    .step {
      width: 34px;
      height: 34px;
      border-radius: 17px;
      align-items: center;
      justify-content: center;
      background-color: #eef2ef;
    }
    .step-text {
      font-size: 18px;
      font-weight: 600;
      color: #24312b;
    }
    .value {
      font-size: 15px;
      font-weight: 600;
      color: #101a14;
      min-width: 48px;
      text-align: center;
    }
    @media (prefers-color-scheme: dark) {
      .label {
        color: #93a49a;
      }
      .step {
        background-color: #1e2a24;
      }
      .step-text {
        color: #d6e2da;
      }
      .value {
        color: #eaf2ec;
      }
    }
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

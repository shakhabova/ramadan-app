import { Component, inject, output, signal } from '@angular/core';
import { Pressable, ScrollView, Text, TextInput, View } from '@ng-native/components';
import { DeepLinks } from '@ng-native/device';
import { I18n } from '../../core/i18n.ts';

const FEEDBACK_EMAIL = 'support@ramadantracker.app';
type FeedbackKind = 'review' | 'bug' | 'idea';

@Component({
  selector: 'app-feedback',
  imports: [Pressable, ScrollView, Text, TextInput, View],
  host: { style: 'flex: 1' },
  styleUrl: '../../shared/theme.css',
  template: `
    <scroll-view class="screen" [contentContainerStyle]="{ padding: 18, gap: 16, paddingBottom: 28 }">
      <view class="card-head">
        <pressable class="back" accessibilityRole="button" [accessibilityLabel]="i18n.t('common.back')" (press)="closed.emit()">
          <text class="back-text">‹</text>
        </pressable>
        <text class="feedback-title">{{ i18n.t('feedback.title') }}</text>
        <view class="back-spacer"></view>
      </view>

      <view class="intro">
        <text class="intro-icon">◌</text>
        <text class="intro-text">{{ i18n.t('feedback.intro') }}</text>
      </view>

      @for (item of categories; track item.kind) {
        <pressable
          class="link-card"
          accessibilityRole="button"
          [accessibilityState]="{ selected: kind() === item.kind }"
          [style]="kind() === item.kind ? selectedStyle : {}"
          (press)="kind.set(item.kind)"
        >
          <text class="category-icon">{{ item.icon }}</text>
          <view class="link-body">
            <text class="link-title">{{ i18n.t('feedback.' + item.kind) }}</text>
            <text class="link-subtitle">{{ i18n.t('feedback.' + item.kind + 'Text') }}</text>
          </view>
          <text class="chevron">{{ kind() === item.kind ? '✓' : '›' }}</text>
        </pressable>
      }

      <view class="card">
        <text class="section-title">{{ i18n.t('feedback.write') }}</text>
        <text-input
          class="input message-input"
          [value]="message()"
          [placeholder]="i18n.t('feedback.placeholder')"
          placeholderTextColor="#75847b"
          [multiline]="true"
          [maxLength]="500"
          textAlignVertical="top"
          (changeText)="message.set($event)"
        />
        <text class="counter">{{ i18n.t('feedback.counter', { n: message().length }) }}</text>
        @if (showEmptyError()) {
          <text class="error">{{ i18n.t('feedback.empty') }}</text>
        }
        <pressable class="primary" accessibilityRole="button" (press)="send()">
          <text class="primary-text">↗ {{ i18n.t('feedback.send') }}</text>
        </pressable>
        <text class="meta">{{ i18n.t('feedback.hint') }}</text>
      </view>

      <text class="thanks">{{ i18n.t('feedback.thanks') }}</text>
    </scroll-view>
  `,
  styles: `
    .back { width: 40px; height: 40px; justify-content: center; }
    .back-text { color: #d5b576; font-size: 34px; }
    .back-spacer { width: 40px; }
    .feedback-title { color: #f3ecdf; font-family: serif; font-size: 23px; }
    .intro { align-items: center; gap: 14px; padding: 14px 28px; }
    .intro-icon { color: #d5b576; font-size: 58px; }
    .intro-text { color: #b5beb6; font-size: 15px; line-height: 1.5; text-align: center; }
    .category-icon { color: #d5b576; font-size: 25px; width: 32px; text-align: center; }
    .message-input { height: 132px; }
    .counter { color: #829087; font-size: 11px; text-align: right; }
    .thanks { color: #d5b576; font-family: serif; font-size: 15px; text-align: center; padding: 10px; }
  `,
})
export class FeedbackScreen {
  protected readonly i18n = inject(I18n);
  private readonly links = inject(DeepLinks);
  readonly closed = output<void>();

  protected readonly kind = signal<FeedbackKind>('review');
  protected readonly message = signal('');
  protected readonly showEmptyError = signal(false);
  protected readonly selectedStyle = { borderColor: '#d5b576', backgroundColor: '#1b2923' };
  protected readonly categories: { kind: FeedbackKind; icon: string }[] = [
    { kind: 'review', icon: '☆' },
    { kind: 'bug', icon: '!' },
    { kind: 'idea', icon: '✦' },
  ];

  protected send(): void {
    const body = this.message().trim();
    if (!body) {
      this.showEmptyError.set(true);
      return;
    }
    this.showEmptyError.set(false);
    const category = this.i18n.t(`feedback.${this.kind()}`);
    const subject = this.i18n.t('feedback.subject', { category });
    this.links.open(
      `mailto:${FEEDBACK_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`,
    );
  }
}

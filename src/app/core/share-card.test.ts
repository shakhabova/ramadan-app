import { expect, test, vi } from 'vitest';
import { injectService } from '@ng-native/testing';
import { FILE_SHARING, ShareCard, VIEW_SHOT } from './share-card.ts';

test('captures the reminder view and shares it as a PNG', async () => {
  const captureRef = vi.fn(async () => 'file:///ramadan-reminder.png');
  const shareAsync = vi.fn(async () => {});
  const share = injectService(ShareCard, {
    providers: [
      { provide: VIEW_SHOT, useValue: { captureRef } },
      { provide: FILE_SHARING, useValue: { shareAsync } },
    ],
  });

  await share.share(42, 'Напоминание', 'Текст');

  expect(captureRef).toHaveBeenCalledWith(42, expect.objectContaining({ format: 'png' }));
  expect(shareAsync).toHaveBeenCalledWith(
    'file:///ramadan-reminder.png',
    expect.objectContaining({ mimeType: 'image/png' }),
  );
});

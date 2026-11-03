import { InjectionToken, Injectable, inject } from '@angular/core';
import { Sharing } from '@ng-native/device';
import { expoModule } from '@ng-native/expo';

interface ViewShotModule {
  captureRef(
    tag: number,
    options: { format: 'png'; result: 'tmpfile'; fileName: string },
  ): Promise<string>;
}

interface SharingModule {
  shareAsync(
    uri: string,
    options: { mimeType: string; UTI: string; dialogTitle: string },
  ): Promise<void>;
}

export const VIEW_SHOT = new InjectionToken<ViewShotModule | null>('app.view-shot', {
  factory: () =>
    expoModule('react-native-view-shot', () => require('react-native-view-shot') as ViewShotModule),
});

export const FILE_SHARING = new InjectionToken<SharingModule | null>('app.file-sharing', {
  factory: () => expoModule('expo-sharing', () => require('expo-sharing') as SharingModule),
});

/** Captures the native reminder view itself, so the share sheet receives a real PNG card. */
@Injectable({ providedIn: 'root' })
export class ShareCard {
  private readonly viewShot = inject(VIEW_SHOT);
  private readonly fileSharing = inject(FILE_SHARING);
  private readonly textSharing = inject(Sharing);

  async share(tag: number | null, title: string, fallbackText: string): Promise<boolean> {
    if (tag !== null && this.viewShot && this.fileSharing) {
      try {
        const uri = await this.viewShot.captureRef(tag, {
          format: 'png',
          result: 'tmpfile',
          fileName: 'ramadan-reminder',
        });
        await this.fileSharing.shareAsync(uri, {
          mimeType: 'image/png',
          UTI: 'public.png',
          dialogTitle: title,
        });
        return true;
      } catch {
        // A build without either native half still has the text fallback below.
      }
    }

    // Expo Go and Node do not contain the two native modules. Text remains a useful fallback.
    return this.textSharing.share({ title, message: fallbackText });
  }
}

import { Injectable, signal, effect } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type AppLanguage = 'en' | 'ar';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  currentLanguage = signal<AppLanguage>(this.getSavedLanguage());
  isRtl = signal(this.getSavedLanguage() === 'ar');

  constructor(private translate: TranslateService) {
    this.translate.addLangs(['en', 'ar']);
    this.translate.setDefaultLang('en');
    this.setLanguage(this.currentLanguage());

    effect(() => {
      const lang = this.currentLanguage();
      this.isRtl.set(lang === 'ar');
    });
  }

  setLanguage(lang: AppLanguage): void {
    this.currentLanguage.set(lang);
    this.translate.use(lang);
    localStorage.setItem('appLanguage', lang);
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.body.classList.toggle('rtl', lang === 'ar');
    document.body.classList.toggle('ltr', lang !== 'ar');
  }

  toggleLanguage(): void {
    const newLang: AppLanguage = this.currentLanguage() === 'en' ? 'ar' : 'en';
    this.setLanguage(newLang);
  }

  private getSavedLanguage(): AppLanguage {
    const saved = localStorage.getItem('appLanguage');
    return (saved === 'ar' || saved === 'en') ? saved : 'en';
  }
}

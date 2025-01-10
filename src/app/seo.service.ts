import { isPlatformServer } from '@angular/common';
import { Inject, Injectable, makeStateKey, PLATFORM_ID, TransferState } from '@angular/core';
import { Meta, Title } from '@angular/platform-browser';

const META_TAG_KEY = makeStateKey('meta-tags');

@Injectable({
  providedIn: 'root',
})
export class SeoService {
  constructor(
    private meta: Meta,
    private titleService: Title,
    private transferState: TransferState,
    @Inject(PLATFORM_ID) private platformId: Object

  ) {}

  generateTags(tags: any) {
    tags = {
      title: 'Football Fans App',
      description:
        'Join the ultimate community for football fans. Connect with other fans, share your passion, and stay updated with the latest in football.',
      image: 'assets/icons/football_logo.png',
      url: 'https://app.dev.footballfans.com/',
      ...tags,
    };

    this.titleService.setTitle(tags.title);

    if (this.transferState.hasKey(META_TAG_KEY)) {
      return;
    }

  
      this.meta.updateTag({ name: 'title', content: tags.title });
      this.meta.updateTag({ name: 'description', content: tags.description });
  
      // Open Graph tags
      this.meta.updateTag({ property: 'og:type', content: 'website' });
      this.meta.updateTag({ property: 'og:url', content: tags.url });
      this.meta.updateTag({ property: 'og:title', content: tags.title });
      this.meta.updateTag({
        property: 'og:description',
        content: tags.description,
      });
      this.meta.updateTag({ property: 'og:image', content: tags.image });
  
      // Twitter Card tags
      this.meta.updateTag({
        name: 'twitter:card',
        content: 'summary_large_image',
      });
      this.meta.updateTag({ name: 'twitter:url', content: tags.url });
      this.meta.updateTag({ name: 'twitter:title', content: tags.title });
      this.meta.updateTag({
        name: 'twitter:description',
        content: tags.description,
      });
      this.meta.updateTag({ name: 'twitter:image', content: tags.image });
  
      this.transferState.set(META_TAG_KEY, tags);

  }
}

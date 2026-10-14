import {
  defineConfig,
  minimal2023Preset,
  type Preset,
} from '@vite-pwa/assets-generator/config';

const background = '#09090b';

const preset: Preset = {
  ...minimal2023Preset,
  maskable: { ...minimal2023Preset.maskable, resizeOptions: { background } },
  apple: { ...minimal2023Preset.apple, resizeOptions: { background } },
};

export default defineConfig({
  headLinkOptions: { preset: '2023' },
  preset,
  images: ['public/icons/logo.svg'],
});

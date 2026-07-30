
import { aliases, mdi } from 'vuetify/iconsets/mdi-svg';
import { mdiEye, mdiEyeOff } from '@mdi/js';
import 'vuetify/styles';

// Composables
import { createVuetify } from 'vuetify'

export default createVuetify({
  theme: {
    defaultTheme: 'dark',
  },
  icons: {
    defaultSet: 'mdi',
    aliases: {
      ...aliases,
      eye: mdiEye,
      eye_off: mdiEyeOff
    },
    sets: {
      mdi
    },
  }
})

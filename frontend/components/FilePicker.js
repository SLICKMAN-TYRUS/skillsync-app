// Cross-platform file picker helper
// Tries expo-document-picker on native, falls back to a hidden <input type="file"> on web.
import { Platform } from 'react-native';

export async function pickFile(options = {}) {
  const accept = options.accept || ['.pdf', '.doc', '.docx'];
  // Native (expo) flow
  try {
    // dynamic require via eval to avoid webpack resolving this module at build-time for web
    // eslint-disable-next-line no-eval
    const DocumentPicker = eval("require")('expo-document-picker');
    const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true, type: '*/*' });
    if (res.type !== 'success') return null;
    const name = res.name || res.uri.split('/').pop();
    // size might be unavailable; try to fetch blob on web/native
    let size = res.size || null;
    if (!size) {
      try {
        const r = await fetch(res.uri);
        const b = await r.blob();
        size = b.size;
      } catch (e) {
        // ignore
      }
    }
    return { name, uri: res.uri, size };
  } catch (e) {
    // Web fallback using DOM
    if (typeof window === 'undefined') return null;
    return await new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = accept.join(',');
      input.style.display = 'none';
      document.body.appendChild(input);
      input.onchange = async (ev) => {
        const file = ev.target.files[0];
        if (!file) {
          resolve(null);
          document.body.removeChild(input);
          return;
        }
        const uri = window.URL.createObjectURL(file);
        resolve({ name: file.name, uri, size: file.size, file });
        document.body.removeChild(input);
      };
      input.click();
    });
  }
}

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

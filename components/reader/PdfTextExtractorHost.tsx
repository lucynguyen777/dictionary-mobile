import { useEffect, useMemo, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

import { buildPdfExtractionHtml, nativePdfExtractionBridge } from '@/data/pdfWebViewExtraction';

// Invisible WebView that runs pdf.js for native PDF import (Hermes cannot). Mounted once at the
// app root on native builds with EXPO_PUBLIC_READER_ENABLE_NATIVE_PDF=true.
export default function PdfTextExtractorHost() {
  const webViewRef = useRef<WebView>(null);
  const html = useMemo(() => buildPdfExtractionHtml(), []);

  useEffect(() => {
    nativePdfExtractionBridge.attach((script) => webViewRef.current?.injectJavaScript(script));
    return () => nativePdfExtractionBridge.detach();
  }, []);

  return (
    <View pointerEvents="none" style={styles.hidden}>
      <WebView
        javaScriptEnabled
        onMessage={(event) => nativePdfExtractionBridge.handleMessage(event.nativeEvent.data)}
        originWhitelist={['*']}
        ref={webViewRef}
        source={{ baseUrl: 'https://localhost/', html }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  hidden: { height: 1, left: -10, opacity: 0, position: 'absolute', top: -10, width: 1 },
});

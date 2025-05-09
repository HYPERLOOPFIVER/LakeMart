import React from 'react';
import { StyleSheet, View, Platform, StatusBar } from 'react-native';
import { WebView } from 'react-native-webview';

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="black" />
      <WebView
  source={{ uri: 'https://shoptorder.netlify.app' }}
  javaScriptEnabled
  domStorageEnabled
  allowsInlineMediaPlayback
  originWhitelist={['*']}
  startInLoadingState={true}
  bounces={false}
  style={styles.webview}
  injectedJavaScript={`
    const meta = document.createElement('meta');
    meta.setAttribute('name', 'viewport');
    meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
    document.getElementsByTagName('head')[0].appendChild(meta);

    document.body.style.userSelect = 'none';
    document.body.style.webkitUserSelect = 'none';
    document.documentElement.style.overflow = 'hidden';
    true;
  `}
/>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  webview: {
    flex: 1,
  },
});

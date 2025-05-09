import React, { useState, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';

// This component allows you to load and render HTML files from your assets
export default function CustomHtmlRenderer({ htmlContent, onNavigate }) {
  const [loading, setLoading] = useState(true);

  // The injected JavaScript to make the HTML behave like a native app
  const injectedJavaScript = `
    (function() {
      // Prevent text selection
      document.documentElement.style.webkitUserSelect = 'none';
      document.documentElement.style.userSelect = 'none';
      
      // Disable zooming
      document.documentElement.style.touchAction = 'pan-x pan-y';
      
      // Disable long press menu
      document.body.style.webkitTouchCallout = 'none';
      
      // Make the content fit the viewport
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=cover';
      document.head.appendChild(meta);
      
      // Better scrolling feel
      document.body.style.overscrollBehavior = 'none';
      
      // Style links and disable browser-like behaviors
      const styleSheet = document.createElement('style');
      styleSheet.textContent = \`
        a {
          -webkit-tap-highlight-color: transparent;
        }
        * {
          -webkit-touch-callout: none;
          -webkit-user-select: none;
          user-select: none;
        }
        body {
          margin: 0;
          padding: 0;
          overflow-x: hidden;
        }
      \`;
      document.head.appendChild(styleSheet);
      
      // Intercept clicks on links to handle them natively if needed
      document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (link && link.getAttribute('href') && link.getAttribute('href').startsWith('http')) {
          e.preventDefault();
          window.ReactNativeWebView.postMessage(JSON.stringify({
            type: 'link',
            url: link.getAttribute('href')
          }));
        }
      });
      
      // Signal that the script was injected
      window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'loaded'
      }));
      
      true;
    })();
  `;

  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'link' && onNavigate) {
        onNavigate(data.url);
      } else if (data.type === 'loaded') {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error parsing message:', error);
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: htmlContent }}
        injectedJavaScript={injectedJavaScript}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        bounces={false}
        scrollEnabled={true}
        showsVerticalScrollIndicator={false}
        showsHorizontalScrollIndicator={false}
        contentInsetAdjustmentBehavior="automatic"
        automaticallyAdjustContentInsets={false}
        textInteractionEnabled={false}
        hideKeyboardAccessoryView={true}
        overScrollMode="never"
        style={styles.webView}
      />
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      )}
    </View>
  );
}

// Helper function to load HTML file from assets
export const loadHtmlFromAssets = async (filePath) => {
  try {
    const fileUri = `${FileSystem.documentDirectory}${filePath}`;
    const fileContent = await FileSystem.readAsStringAsync(fileUri);
    return fileContent;
  } catch (error) {
    console.error('Error loading HTML file:', error);
    return `<html><body><h1>Error loading content</h1><p>${error.message}</p></body></html>`;
  }
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
});
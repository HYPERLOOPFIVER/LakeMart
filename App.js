import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, View, ActivityIndicator, StatusBar, BackHandler, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import Constants from 'expo-constants';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const webViewRef = useRef(null);
  const [webViewCanGoBack, setWebViewCanGoBack] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Set navigation bar color on Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      NavigationBar.setBackgroundColorAsync('#000000');
      NavigationBar.setButtonStyleAsync('light');
    }
  }, []);

  const hideLoaderAndSplash = async () => {
    setIsLoading(false);
    try {
      await SplashScreen.hideAsync();
    } catch (e) {
      // Ignore error if splash screen is already hidden
      console.log('SplashScreen might already be hidden', e);
    }
  };

  // Handle back button press for Android
  useEffect(() => {
    if (Platform.OS === 'android') {
      const backAction = () => {
        if (webViewCanGoBack && webViewRef.current) {
          webViewRef.current.goBack();
          return true;
        }
        return false;
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
      return () => backHandler.remove();
    }
  }, [webViewCanGoBack]);

  // Handle network errors
  const handleLoadError = (e) => {
    setHasError(true);
    setIsLoading(false);
    console.error('WebView error:', e.nativeEvent);
  };

  // Enhanced JavaScript injection for native feel
  const injectedJavaScript = `
    (function() {
      // Remove any existing margins/padding
      document.body.style.margin = 0;
      document.body.style.padding = 0;
      document.documentElement.style.margin = 0;
      document.documentElement.style.padding = 0;
      
      // Disable text selection and context menu for native-like experience
      document.addEventListener('selectstart', function(e) { e.preventDefault(); });
      document.addEventListener('contextmenu', function(e) { e.preventDefault(); });
      
      // Force viewport settings
      const meta = document.querySelector('meta[name="viewport"]') || document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      if (!document.querySelector('meta[name="viewport"]')) {
        document.getElementsByTagName('head')[0].appendChild(meta);
      }
      
      // Disable touch callout and tap highlight
      document.documentElement.style.webkitTouchCallout = 'none';
      document.documentElement.style.webkitUserSelect = 'none';
      document.documentElement.style.webkitTapHighlightColor = 'rgba(0,0,0,0)';
      
      // Disable pull-to-refresh and overscroll effects
      document.body.style.overscrollBehavior = 'none';
      
      // Ensure full width/height
      document.body.style.width = '100%';
      document.body.style.height = '100%';
      document.documentElement.style.width = '100%';
      document.documentElement.style.height = '100%';
      
      // Fix for iOS safe areas
      const style = document.createElement('style');
      style.innerHTML = \`
        body {
          padding-top: env(safe-area-inset-top);
          padding-bottom: env(safe-area-inset-bottom);
          padding-left: env(safe-area-inset-left);
          padding-right: env(safe-area-inset-right);
        }
        * {
          -webkit-tap-highlight-color: transparent;
        }
      \`;
      document.head.appendChild(style);
      
      // Force black background
      document.body.style.backgroundColor = '#000000';
      
      // Intercept network errors
      window.addEventListener('error', function(e) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'error',
          message: e.message
        }));
      });

      // Monitor network status
      window.addEventListener('online', function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'network',
          status: 'online'
        }));
      });
      
      window.addEventListener('offline', function() {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'network',
          status: 'offline'
        }));
      });
    })();
    
    true;
  `;

  // Handle messages from WebView
  const handleMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'network' && data.status === 'offline') {
        alert('No internet connection. Please check your network settings.');
      }
    } catch (e) {
      console.log('Invalid message from WebView', e);
    }
  };

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#000000" translucent={false} />
      <View style={styles.fullScreen}>
        {hasError ? (
          <View style={styles.errorContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <View style={styles.errorTextContainer}>
              <Text style={styles.errorText}>
                Unable to connect to the server. Please check your internet connection.
              </Text>
            </View>
          </View>
        ) : (
          <WebView
            ref={webViewRef}
            source={{ uri: 'https://shoptorder.netlify.app' }}
            style={styles.webview}
            onError={handleLoadError}
            injectedJavaScript={injectedJavaScript}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            startInLoadingState={true}
            scalesPageToFit={false}
            onLoad={hideLoaderAndSplash}
            onLoadStart={() => setIsLoading(true)}
            onLoadEnd={() => setIsLoading(false)}
            onMessage={handleMessage}
            onNavigationStateChange={(navState) => {
              setWebViewCanGoBack(navState.canGoBack);
            }}
            renderLoading={() => (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color="#FFFFFF" />
              </View>
            )}
            bounces={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            allowsBackForwardNavigationGestures={false}
            pullToRefreshEnabled={false}
            overScrollMode="never"
            mixedContentMode="compatibility"
            setSupportMultipleWindows={false}
            thirdPartyCookiesEnabled={true}
            sharedCookiesEnabled={true}
            textZoom={100}
            allowsInlineMediaPlayback={true}
            mediaPlaybackRequiresUserAction={false}
            originWhitelist={['*']} // Allow all origins
            onShouldStartLoadWithRequest={(request) => {
              // Allow all URLs to load
              return true;
            }}
            cacheEnabled={true}
            cacheMode="LOAD_DEFAULT"
            useWebKit={true}
          />
        )}
        {isLoading && !hasError && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
          </View>
        )}
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  fullScreen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  webview: {
    flex: 1,
    backgroundColor: '#000000',
  },
  loaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
    padding: 20,
  },
  errorTextContainer: {
    marginTop: 20,
  },
  errorText: {
    color: '#FFFFFF',
    textAlign: 'center',
    fontSize: 16,
  }
});
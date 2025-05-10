import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Platform,
  StatusBar,
  ActivityIndicator,
  Alert,
  BackHandler,
  SafeAreaView,
  Text,
  Button
} from 'react-native';
import { WebView } from 'react-native-webview';
import NetInfo from '@react-native-community/netinfo';

export default function App() {

  const [canGoBack, setCanGoBack] = useState(false);
  const [isConnected, setIsConnected] = useState(true);
  const webViewRef = useRef(null);
  const firstLoadRef = useRef(true);

  // Monitor internet connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });
    return () => unsubscribe();
  }, []);

  // Handle Android back button
  useEffect(() => {
    const backAction = () => {
      if (canGoBack && webViewRef.current) {
        webViewRef.current.goBack();
        return true;
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [canGoBack]);

  // Handle navigation state changes
  const handleNavigationStateChange = (navState) => {
    setCanGoBack(navState.canGoBack);
  };

  // Handle load end
  const handleLoadEnd = () => {
    if (firstLoadRef.current) {
      firstLoadRef.current = false;
    }
    setLoading(false);
  };

  // Handle messages from WebView
  const onMessage = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'alert') {
        Alert.alert('Lakes Mart', data.message, [{ text: 'OK' }]);
      } else if (data.type === 'confirm') {
        Alert.alert('Lakes Mart', data.message, [
          {
            text: 'Cancel',
            onPress: () => {
              webViewRef.current.injectJavaScript(`window.dispatchEvent(new MessageEvent('message', { data: 'confirmResult:false' }));`);
            },
            style: 'cancel'
          },
          {
            text: 'OK',
            onPress: () => {
              webViewRef.current.injectJavaScript(`window.dispatchEvent(new MessageEvent('message', { data: 'confirmResult:true' }));`);
            }
          }
        ]);
      }
    } catch (error) {
      console.log('Error parsing message:', error);
    }
  };

  // Render loading indicator
 

  // Render offline message
 
  

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar
        barStyle="dark-content"
        backgroundColor="#ffffff"
        translucent={false}
      />

      <View style={styles.container}>
        {isConnected ? (
          <>
           
<WebView
  originWhitelist={['*']}
  source={require('./assets/index.html')} // Local HTML file
  ref={webViewRef}
        
              javaScriptEnabled={true}
              domStorageEnabled={true}
              allowsInlineMediaPlayback={true}
            
              startInLoadingState={true}
              renderLoading={renderLoading}
              scalesPageToFit={Platform.OS === 'android'}
              useWebKit={true}
              bounces={false}
              scrollEnabled={true}
              cacheEnabled={true}
              cacheMode="LOAD_DEFAULT"
              thirdPartyCookiesEnabled={true}
              sharedCookiesEnabled={true}
              style={styles.webview}
              incognito={false}
             
              onNavigationStateChange={handleNavigationStateChange}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.warn('WebView error: ', nativeEvent);
              }}
              onHttpError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.warn('WebView HTTP error: ', nativeEvent);
              }}
              onMessage={onMessage}
              injectedJavaScript={`
                (function() {
                  // Fix viewport for mobile
                  const meta = document.createElement('meta');
                  meta.setAttribute('name', 'viewport');
                  meta.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
                  document.getElementsByTagName('head')[0].appendChild(meta);

                  // Prevent pull-to-refresh behavior
                  document.body.style.overscrollBehavior = 'none';

                  // Make it feel like a native app by preventing selection
                  document.body.style.userSelect = 'none';
                  document.body.style.webkitUserSelect = 'none';
                  document.body.style.webkitTouchCallout = 'none';
                  document.documentElement.style.webkitUserSelect = 'none';
                  document.documentElement.style.webkitTouchCallout = 'none';

                  // Fix any overflow issues
                  document.documentElement.style.overflow = 'auto';
                  document.body.style.overflow = 'auto';

                  // Prevent context menu on long press
                  document.addEventListener('contextmenu', function(e) {
                    e.preventDefault();
                    return false;
                  }, false);

                  // Prevent dragging of elements
                  document.addEventListener('dragstart', function(e) {
                    e.preventDefault();
                    return false;
                  }, false);

                  // Handle all links to prevent drag behavior
                  function setupLinks() {
                    const allLinks = document.querySelectorAll('a, img, button');
                    allLinks.forEach(el => {
                      el.style.webkitTouchCallout = 'none';
                      el.style.webkitUserDrag = 'none';
                      el.setAttribute('draggable', 'false');

                      // Prevent default link behavior that might cause issues
                      if (el.tagName === 'A') {
                        el.addEventListener('touchend', function(e) {
                          if (this.getAttribute('href') && this.getAttribute('target') !== '_blank') {
                            e.preventDefault();
                            window.location.href = this.getAttribute('href');
                          }
                        });
                      }
                    });
                  }

                  // Setup links on page load but avoid excessive processing
                  let setupLinksTimeout = null;
                  setupLinks();

                  // Throttled setup for links when DOM changes (for dynamic content)
                  const observer = new MutationObserver(function() {
                    if (setupLinksTimeout) {
                      clearTimeout(setupLinksTimeout);
                    }
                    setupLinksTimeout = setTimeout(function() {
                      setupLinks();
                    }, 300); // Debounce to prevent multiple executions
                  });

                  // Start observing once document is fully loaded
                  if (document.readyState === 'complete') {
                    observer.observe(document.body, {
                      childList: true,
                      subtree: true
                    });
                  } else {
                    window.addEventListener('load', function() {
                      observer.observe(document.body, {
                        childList: true,
                        subtree: true
                      });
                    });
                  }

                  // Override alert with custom implementation
                  window.alert = function(message) {
                    window.ReactNativeWebView.postMessage(JSON.stringify({
                      type: 'alert',
                      message: message
                    }));
                  };

                  // Override confirm with custom implementation
                  window.confirm = function(message) {
                    return new Promise((resolve) => {
                      window.ReactNativeWebView.postMessage(JSON.stringify({
                        type: 'confirm',
                        message: message
                      }));

                      const listener = (event) => {
                        if (event.data === 'confirmResult:true') {
                          resolve(true);
                          window.removeEventListener('message', listener);
                        } else if (event.data === 'confirmResult:false') {
                          resolve(false);
                          window.removeEventListener('message', listener);
                        }
                      };

                      window.addEventListener('message', listener);
                    });
                  };

                  true;
                })();
              `}
            />
            {loading && renderLoading()}
          </>
        ) : (
          renderOffline()
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  webview: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  offlineContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  offlineText: {
    fontSize: 18,
    marginBottom: 10,
  },
});

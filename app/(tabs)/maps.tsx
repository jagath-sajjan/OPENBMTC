import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView, Edge, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEffect, useRef, useState } from 'react';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useNavigation } from 'expo-router';
import { WebView } from 'react-native-webview';

const TRANSIT_ROUTER_URL = 'https://transitrouter.pages.dev/#/blr/';

export default function MapsScreen() {
    const insets = useSafeAreaInsets();
    const tabBarHeight = useBottomTabBarHeight();
    const webViewRef = useRef<WebView>(null);
    const [currentUrl, setCurrentUrl] = useState(TRANSIT_ROUTER_URL);
    const [webViewKey, setWebViewKey] = useState(0);
    const navigation = useNavigation();

    useEffect(() => {
        const unsubscribe = navigation.addListener('tabPress', () => {
            setCurrentUrl(TRANSIT_ROUTER_URL);
            setWebViewKey((prev) => prev + 1);
        });

        return unsubscribe;
    }, [navigation]);

    return (
        <View style={styles.container}>
            <SafeAreaView edges={['top'] as Edge[]} style={styles.safeArea}>
                <View style={styles.content}>
                    <View style={[styles.webViewContainer, { marginBottom: tabBarHeight }]}>
                        <WebView
                            key={webViewKey}
                            ref={webViewRef}
                            source={{ uri: currentUrl }}
                            originWhitelist={['*']}
                            javaScriptEnabled
                            domStorageEnabled
                            startInLoadingState
                            setSupportMultipleWindows={false}
                            onOpenWindow={(event) => {
                                const targetUrl = event.nativeEvent?.targetUrl;
                                if (targetUrl) {
                                    setCurrentUrl(targetUrl);
                                }
                            }}
                            onShouldStartLoadWithRequest={(request) => {
                                if (request.url && request.url !== currentUrl) {
                                    setCurrentUrl(request.url);
                                }
                                return true;
                            }}
                            style={styles.webView}
                        />
                    </View>
                    <View
                        pointerEvents="none"
                        style={[styles.footer, { top: Math.max(insets.top + 8, 16) }]}
                    >
                        <Text style={styles.footerText}>maps by: transitrouter.pages.dev</Text>
                    </View>
                </View>
            </SafeAreaView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F7F4EF',
    },
    safeArea: {
        flex: 1,
    },
    content: {
        flex: 1,
    },
    webViewContainer: {
        flex: 1,
    },
    webView: {
        flex: 1,
        backgroundColor: '#F7F4EF',
    },
    footer: {
        position: 'absolute',
        left: 0,
        right: 0,
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: 6,
        backgroundColor: 'transparent',
    },
    footerText: {
        fontSize: 12,
        fontFamily: 'Poppins_400Regular',
        color: '#9CA3AF',
    },
});

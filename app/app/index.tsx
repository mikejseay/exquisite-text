import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { BackHandler, Platform, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";
import type {
    ShouldStartLoadRequest,
    WebViewNavigation,
} from "react-native-webview/lib/WebViewTypes";

import CustomStatusBar from "app/components/CustomStatusBar";
import { allowedOrigin, getIsAllowedUrl } from "utils/urlValidation";

void SplashScreen.preventAutoHideAsync();

export default function Index() {
    const initialUrl = `${allowedOrigin}/`;
    const [ webViewKey, setWebViewKey ] = useState(0);
    const [ sourceUri, setSourceUri ] = useState(initialUrl);

    const webViewRef = useRef<WebView>(null);

    const hideSplashScreen = async () => await SplashScreen.hideAsync();
    const reloadWebView = () => setWebViewKey((currentKey) => currentKey + 1);

    const onAndroidBackPress = useMemo(() => {
        return (): boolean => {
            if (webViewRef.current) {
                webViewRef.current.goBack();
                return true; // prevent default behavior (exit app)
            }
            return false;
        };
    }, []);

    useEffect((): (() => void) | undefined => {
        if (Platform.OS !== "android") {
            return undefined;
        }

        const backPressSubscription = BackHandler.addEventListener(
            "hardwareBackPress",
            onAndroidBackPress,
        );

        return (): void => {
            backPressSubscription.remove();
        };
    }, [ onAndroidBackPress ]);

    const forceBackToAllowedSite = (): void => {
        webViewRef.current?.stopLoading();
        setSourceUri(initialUrl);
        setWebViewKey((currentKey) => currentKey + 1);
    };

    const onShouldStartLoadWithRequest = (
        request: ShouldStartLoadRequest,
    ): boolean => {
        const requestedUrl = request.url ?? "";
        return getIsAllowedUrl(requestedUrl);
    };

    const onNavigationStateChange = (navigation: WebViewNavigation): void => {
        const currentUrl = navigation.url ?? "";
        if (!getIsAllowedUrl(currentUrl)) {
            forceBackToAllowedSite();
        }
    };

    if (Platform.OS === "web") {
        return (
            <SafeAreaProvider>
                <CustomStatusBar />
                <View style={styles.webContainer}>
                    <iframe
                        src={initialUrl}
                        style={styles.webIframe as React.CSSProperties}
                        title={"Exquisite Text"}
                        allow={"fullscreen"}
                    />
                </View>
            </SafeAreaProvider>
        );
    }

    return (
        <SafeAreaProvider>
            <CustomStatusBar />
            <WebView
                allowsBackForwardNavigationGestures
                decelerationRate={0.998}
                javaScriptCanOpenWindowsAutomatically={false}
                bounces={false}
                allowsLinkPreview={false}
                key={webViewKey}
                mediaPlaybackRequiresUserAction={false}
                onContentProcessDidTerminate={reloadWebView}
                onLoadEnd={hideSplashScreen}
                onNavigationStateChange={onNavigationStateChange}
                onRenderProcessGone={reloadWebView}
                onShouldStartLoadWithRequest={onShouldStartLoadWithRequest}
                ref={webViewRef}
                sharedCookiesEnabled={false}
                source={{
                    uri: sourceUri,
                }}
                startInLoadingState
                style={styles.container}
            />
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        marginTop: -2,
    },
    webContainer: {
        flex: 1,
    },
    webIframe: {
        borderWidth: 0,
        height: "100%",
        width: "100%",
    },
});

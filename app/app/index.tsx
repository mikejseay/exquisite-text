import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { BackHandler, Platform, StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

import CustomStatusBar from "./components/CustomStatusBar";

void SplashScreen.preventAutoHideAsync();

export default function Index() {
    const uri = "https://www.exquisitetext.com";
    const [ webViewKey, setWebViewKey ] = useState(0);
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

    if (Platform.OS === "web") {
        return (
            <SafeAreaProvider>
                <CustomStatusBar />
                <View style={styles.webContainer}>
                    <iframe
                        src={uri}
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
                decelerationRate={"normal"}
                javaScriptCanOpenWindowsAutomatically
                key={webViewKey}
                mediaPlaybackRequiresUserAction={false}
                onContentProcessDidTerminate={reloadWebView}
                onLoadEnd={hideSplashScreen}
                onRenderProcessGone={reloadWebView}
                ref={webViewRef}
                sharedCookiesEnabled={false}
                source={{
                    uri,
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

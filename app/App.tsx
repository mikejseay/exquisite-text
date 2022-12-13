import * as SplashScreen from "expo-splash-screen";
import React, {
    useEffect,
    useRef,
    useState,
} from "react";
import {
    BackHandler,
    Platform,
    StyleSheet,
} from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { WebView } from "react-native-webview";

import CustomStatusBar from "./client/components/CustomStatusBar";


export default function App() {
    const [ uri, setUri ] = useState("https://www.exquisitetext.com");
    const [ webViewKey, setWebViewKey ] = useState(0);

    const hideSplashScreen = async () => await SplashScreen.hideAsync();
    const reloadWebView = () => setWebViewKey(webViewKey + 1);

    const webViewRef = useRef<WebView>(null);
    const onAndroidBackPress = (): boolean => {
        if (webViewRef.current) {
            webViewRef.current.goBack();
            return true; // prevent default behavior (exit app)
        }
        return false;
    };

    useEffect((): (() => void) | undefined => {
        if (Platform.OS === "android") {
            BackHandler.addEventListener("hardwareBackPress", onAndroidBackPress);
            return (): void => {
                BackHandler.removeEventListener("hardwareBackPress", onAndroidBackPress);
            };
        }
    }, []);

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
});

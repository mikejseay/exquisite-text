import { StatusBar, type StatusBarStyle, useColorScheme, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function useAppBackground(): string {
    const colorScheme = useColorScheme();
    return colorScheme === "dark" ? "#181A1B" : "#fff";
}

export default function CustomStatusBar() {
    const insets = useSafeAreaInsets();
    const backgroundColor = useAppBackground();
    const colorScheme = useColorScheme();
    const isDark: boolean = colorScheme === "dark";
    const barStyle: StatusBarStyle = isDark ? "light-content" : "dark-content";

    return (
        <View
            style={{
                backgroundColor,
                height: insets.top,
            }}
        >
            <StatusBar animated={true} backgroundColor={backgroundColor} barStyle={barStyle} />
        </View>
    );
}

import { useLocalSearchParams, useNavigation } from "expo-router";
import  { useEffect, useState } from "react";
import { StyleSheet, Text, View, ImageBackground, Image, Animated } from "react-native";
import * as React from "react";

type RootStackParamList = {
    "(appPages)/Dashboard": { user: string | string[] };
    // Add other routes here if needed
  };
  
  // Extend the useNavigation hook with the correct type
  type WelcomeScreenNavigationProp = {
    navigate: (route: keyof RootStackParamList, params?: RootStackParamList[keyof RootStackParamList]) => void;
  };
export default function App() {
    const navigation = useNavigation<WelcomeScreenNavigationProp>();
    const { user } = useLocalSearchParams<{ user: string | string[] }>();
    const progress = useState(new Animated.Value(0))[0];

    Animated.timing(progress, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: false,
    }).start();

    useEffect(() => {
        const timer = setTimeout(() => {
            navigation.navigate("(appPages)/Dashboard", {
                user: user,
            });
        }, 2000);

        return () => clearTimeout(timer);
    }, []);

    return (
        <View style={styles.container}>
            <ImageBackground
                source={require('../../assets/images/welcome_img.png')}
                style={styles.backgroundImage}
            >
                <View style={styles.contentContainer}>
                    <Text style={styles.welcomeText}>Welcome To</Text>
                    <View style={styles.logoContainer}>
                        <Image
                            source={require('../../assets/images/logo_white.png')}
                            style={styles.logo}
                        />
                    </View>
                    <Text style={styles.exploreText}>Explore and order delicious meals</Text>
                </View>
            </ImageBackground>

            <View style={styles.loadingBarContainer}>
                <Animated.View
                    style={[
                        styles.loadingBar,
                        {
                            width: progress.interpolate({
                                inputRange: [0, 1],
                                outputRange: ['0%', '100%'],
                            }),
                        },
                    ]}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#4E1365',
        padding: 10,
    },
    backgroundImage: {
        flex: 1,
        resizeMode: "cover",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 35,
        overflow: 'hidden',
    },
    contentContainer: {
        flex: 1,
        paddingVertical: 80,
        justifyContent: "space-between",
        alignItems: 'center',
    },
    welcomeText: {
        fontSize: 32,
        color: "white",
    },
    logoContainer: {
        justifyContent: "center",
        alignItems: "center",
    },
    logo: {
        width: 280,
        height: 250,
    },
    exploreText: {
        fontSize: 32,
        color: "white",
        textAlign: "center",
        paddingHorizontal: 20,
    },
    loadingBarContainer: {
        position: "absolute",
        bottom: 50,
        width: '80%',
        alignSelf: "center",
        height: 5,
        backgroundColor: '#e0e0e0',
    },
    loadingBar: {
        height: '100%',
        backgroundColor: '#4E1365',
    },
});

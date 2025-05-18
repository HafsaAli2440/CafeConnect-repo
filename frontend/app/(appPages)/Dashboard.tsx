import AsyncStorage from "@react-native-async-storage/async-storage";
import { Link, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import * as React from "react";
import { StyleSheet, Text, View, Image, TouchableOpacity, ImageBackground, Alert } from "react-native";

export default function App() {
    const router = useRouter();
    const { user } = useLocalSearchParams();
    const [userRole, setUserRole] = useState<string>('');

    useEffect(() => {
        const getUserRole = async () => {
            try {
                const userData = await AsyncStorage.getItem('userData');
                if (userData) {
                    const { role } = JSON.parse(userData);
                    setUserRole(role);
                }
            } catch (error) {
                console.error('Error getting user role:', error);
            }
        };
        getUserRole();
    }, []);

    const handleLogout = () => {
        Alert.alert(
          "Logout",
          "Are you sure you want to logout?",
          [
            {
              text: "Cancel",
              style: "cancel"
            },
            {
              text: "Logout",
              onPress: () => {
                // Clear any stored user data if you're using storage
                 AsyncStorage.removeItem('userData');
                router.replace('/(auth)/User_Select');
              },
              style: 'destructive'
            }
          ]
        );
    };

    const renderAdminDashboard = () => (
        <View style={styles.dashboardContainer}>
            <Text style={styles.headerText}>Admin Dashboard</Text>
            <Image
                source={require("../../assets/images/chef_img.png")}
                style={styles.image}
            />
            <Link href={"/(appPages)/(Admin)/Categories"} asChild>
                <TouchableOpacity style={styles.adminButton}>
                    <Text style={styles.buttonText}>Manage Categories</Text>
                </TouchableOpacity>
            </Link>
            <Link href={"/(appPages)/(Admin)/Orders"} asChild>
                <TouchableOpacity style={styles.adminButton}>
                    <Text style={styles.buttonText}>View Orders</Text>
                </TouchableOpacity>
            </Link>
            <Link href={"/(appPages)/(Admin)/MenuEdit"} asChild>
                <TouchableOpacity style={styles.adminButton}>
                    <Text style={styles.buttonText}>Manage Menu</Text>
                </TouchableOpacity>
            </Link>
            <Link href={"/(appPages)/(Admin)/RevenueReport"} asChild>
                <TouchableOpacity style={styles.adminButton}>
                    <Text style={styles.buttonText}>Check Revenue</Text>
                </TouchableOpacity>
            </Link>
            <Link href={"/(appPages)/(Delivery)/DeliveryDashboard"} asChild>
                <TouchableOpacity style={styles.adminButton}>
                    <Text style={styles.buttonText}>Delivery Orders</Text>
                </TouchableOpacity>
            </Link>
            <Link href={"/(appPages)/Profile"} asChild>
                <TouchableOpacity style={styles.adminButton}>
                    <Text style={styles.buttonText}>Edit Profile</Text>
                </TouchableOpacity>
            </Link>
            <TouchableOpacity style={styles.adminButton} onPress={handleLogout}>
                <Text style={styles.buttonText}>Log out</Text>
            </TouchableOpacity>
        </View>
    );

    const renderDeliveryDashboard = () => (
        <View style={styles.dashboardContainer}>
            <Text style={styles.headerText}>Delivery Dashboard</Text>
            <Image
                source={require("../../assets/images/student_back.png")}
                style={styles.image}
            />
            <Link href={"/(appPages)/(Delivery)/DeliveryDashboard"} asChild>
                <TouchableOpacity style={styles.adminButton}>
                    <Text style={styles.buttonText}>View Delivery Orders</Text>
                </TouchableOpacity>
            </Link>
            <Link href={"/(appPages)/Profile"} asChild>
                <TouchableOpacity style={styles.adminButton}>
                    <Text style={styles.buttonText}>Edit Profile</Text>
                </TouchableOpacity>
            </Link>
            <TouchableOpacity style={styles.adminButton} onPress={handleLogout}>
                <Text style={styles.buttonText}>Log out</Text>
            </TouchableOpacity>
        </View>
    );

    const renderUserDashboard = () => (
        <ImageBackground
            source={require("../../assets/images/student_back.png")}
            style={styles.backgroundImage}
        >
            <View style={styles.logoContainer}>
                <Image
                    source={require("../../assets/images/logo.png")}
                    style={styles.logo}
                />
            </View>

            <View style={styles.linkContainer}>
                <Link href={"/(appPages)/(User)/Menu"} asChild>
                    <TouchableOpacity style={styles.button}>
                        <Text style={styles.buttonText}>View Menu</Text>
                    </TouchableOpacity>
                </Link>

                <Link href={"/(appPages)/Profile"} asChild>
                    <TouchableOpacity style={styles.button}>
                        <Text style={styles.buttonText}>Edit Profile</Text>
                    </TouchableOpacity>
                </Link>

                <Link href={"/(appPages)/(User)/OrderTracking"} asChild>
                    <TouchableOpacity style={styles.button}>
                        <Text style={styles.buttonText}>Track Orders</Text>
                    </TouchableOpacity>
                </Link>

                <TouchableOpacity style={styles.button} onPress={handleLogout}>
                    <Text style={styles.buttonText}>Log out</Text>
                </TouchableOpacity>
            </View>
        </ImageBackground>
    );

    return (
        <View style={styles.container}>
            {userRole === 'admin' && renderAdminDashboard()}
            {userRole === 'delivery' && renderDeliveryDashboard()}
            {(userRole === 'faculty' || userRole === 'student') && renderUserDashboard()}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#4E1365",
        padding: 10,
    },
    dashboardContainer: {
        flex: 1,
        backgroundColor: "#fff",
        alignItems: "center",
        paddingTop: 15,
        paddingHorizontal: 20,
        borderRadius: 35
    },
    backgroundImage: {
        flex: 1,
        resizeMode: "cover",
        justifyContent: "center",
        alignItems: "center",
        borderRadius: 35,
        overflow: "hidden",
    },
    logoContainer: {
        backgroundColor: "#FFFFFF",
        height: 100,
        width: 140,
        alignItems: "center",
        marginTop: 50,
        marginBottom: 20
    },
    logo: {
        width: 120,
        height: 110,
    },
    linkContainer:{
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingBottom: 200
    },
    button: {
        backgroundColor: "#4B125C",
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 30,
        width: '80%',
        alignItems: "center",
        marginVertical: 5,
    },
    adminButton: {
        backgroundColor: "#4B125C",
        paddingVertical: 15,
        paddingHorizontal: 20,
        borderRadius: 30,
        width: '80%',
        alignItems: "center",
        marginVertical: 8,
    },
    buttonText: {
        color: "white",
        fontSize: 16,
        textAlign: 'center',
    },
    headerText: {
        fontSize: 28,
        fontWeight: "bold",
        color: "black",
        marginBottom: 10,
    },
    image: {
        width: '90%',
        height: 200,
        resizeMode: "contain",
        marginVertical: 10,
    },
});

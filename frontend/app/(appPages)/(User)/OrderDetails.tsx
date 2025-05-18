import { useEffect, useState } from "react";
import * as React from "react";
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ImageBackground } from "react-native";
//import { useRoute } from "@react-navigation/native";
import { AntDesign } from "@expo/vector-icons";
import { Link, useRouter, useLocalSearchParams } from "expo-router";
import { API_BASE_URL } from "@/config/config";

type Order = {
    _id: string;
    orderItems: Array<{
        name: string;
        quantity: number;
        price: number;
    }>;
    totalPrice: number;
    status: 'pending' | 'processing' | 'completed';
    estimatedTime: number;
    createdAt: string;
};

const OrderDetailsPage = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const [order, setOrder] = useState<Order | null>(null);
    const [timeLeft, setTimeLeft] = useState(0);

    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/orders/${params.orderId}`);
                if (response.ok) {
                    const data = await response.json();
                    setOrder(data);
                    setTimeLeft(data.estimatedTime * 60); // Convert minutes to seconds
                }
            } catch (error) {
                console.error('Error fetching order details:', error);
            }
        };

        if (params.orderId) {
            fetchOrderDetails();
        }
    }, [params.orderId]);

    useEffect(() => {
        if (timeLeft <= 0 || !order || order.status === 'completed') return;

        const intervalId = setInterval(() => {
            setTimeLeft((prevTime) => {
                if (prevTime <= 0) {
                    clearInterval(intervalId);
                    return 0;
                }
                return prevTime - 1;
            });
        }, 1000);

        return () => clearInterval(intervalId);
    }, [timeLeft, order]);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds < 10 ? "0" : ""}${remainingSeconds}`;
    };

    const handleBackPress = () => {
        router.back();
    };

    if (!order) return null;

    return (
        <View style={styles.container}>
            <AntDesign 
                onPress={handleBackPress} 
                name="arrowleft" 
                size={26} 
                color="#FFF" 
                style={styles.backArrow} 
            />
            <Text style={styles.title}>Order Details</Text>

            <View style={styles.contentContainer}>
                <View style={styles.orderInfo}>
                    <Text style={styles.orderNumber}>Order #{order._id.slice(-6)}</Text>
                    <Text style={styles.statusText}>Status: {order.status}</Text>
                </View>

                <FlatList
                    data={order.orderItems}
                    keyExtractor={(item, index) => `${item.name}-${index}`}
                    contentContainerStyle={styles.orderList}
                    renderItem={({ item }) => (
                        <View style={styles.orderItem}>
                            <Text style={styles.itemName}>{item.name}</Text>
                            <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                            <Text style={styles.itemPrice}>Rs. {item.price}</Text>
                        </View>
                    )}
                />

                <View style={styles.totalContainer}>
                    <Text style={styles.totalText}>Total Price: Rs. {order.totalPrice}</Text>
                </View>

                {order.status !== 'completed' && (
                    <View style={styles.countdownContainer}>
                        <Text style={styles.countdownText}>
                            Time till delivery: {formatTime(timeLeft)}
                        </Text>
                    </View>
                )}

                {order.status === 'completed' && (
                    <Link replace href={"/(appPages)/Dashboard"} asChild>
                        <TouchableOpacity style={styles.receiveButton}>
                            <Text style={styles.receiveButtonText}>Back to Dashboard</Text>
                        </TouchableOpacity>
                    </Link>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#4E1365",
        padding: 20,
    },
    backArrow: {
        position: 'absolute',
        top: 23,
        left: 10,
        zIndex: 2,
    },
    title: {
        fontSize: 24,
        color: "#fff",
        textAlign: "center",
        marginBottom: 20,
        marginTop: 20,
        fontWeight: "bold",
    },
    contentContainer: {
        flex: 1,
        backgroundColor: "#fff",
        borderRadius: 20,
        padding: 15,
    },
    orderInfo: {
        marginBottom: 20,
        padding: 10,
        backgroundColor: "#f8f8f8",
        borderRadius: 10,
    },
    orderNumber: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#4E1365",
        marginBottom: 5,
    },
    statusText: {
        fontSize: 16,
        color: "#666",
        textTransform: 'capitalize',
    },
    orderList: {
        padding: 10,
    },
    orderItem: {
        backgroundColor: "#f8f8f8",
        borderRadius: 10,
        padding: 15,
        marginBottom: 10,
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    itemName: {
        flex: 2,
        fontSize: 16,
        fontWeight: "bold",
        color: "#4E1365",
    },
    itemQuantity: {
        flex: 1,
        fontSize: 14,
        color: "#666",
        textAlign: 'center',
    },
    itemPrice: {
        flex: 1,
        fontSize: 14,
        color: "#666",
        textAlign: 'right',
    },
    totalContainer: {
        backgroundColor: "#f8f8f8",
        padding: 15,
        borderRadius: 10,
        marginVertical: 10,
    },
    totalText: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#4E1365",
        textAlign: "center",
    },
    countdownContainer: {
        backgroundColor: "#4E1365",
        padding: 15,
        borderRadius: 10,
        marginVertical: 10,
    },
    countdownText: {
        fontSize: 18,
        fontWeight: "bold",
        color: "#fff",
        textAlign: "center",
    },
    receiveButton: {
        backgroundColor: "#4E1365",
        padding: 15,
        borderRadius: 25,
        alignItems: "center",
        marginTop: 10,
    },
    receiveButtonText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
    },
});

export default OrderDetailsPage;

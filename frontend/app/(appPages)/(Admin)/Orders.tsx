import { useEffect, useState } from "react";
import * as React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { Link, useRouter } from "expo-router";
import { AntDesign } from "@expo/vector-icons";
import { API_BASE_URL } from "@/config/config";
type Order = {
    _id: string;
    orderItems: Array<{
        name: string;
        quantity: number;
        price: number;
    }>;
    totalPrice: number;
    status: 'pending' | 'processing' | 'completed' | 'out_for_delivery' | 'delivered';
    estimatedTime: number;
    createdAt: string;
    customerDetails: {
        name: string;
        phone: string;
        address: string;
        location: {
            coordinates: [number, number]; // [longitude, latitude]
            address: string;
        };
    };
};

const OrderItem = ({ order, onStatusUpdate }: { order: Order; onStatusUpdate: () => void }) => {
    const handleProcessOrder = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/update-order-status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId: order._id,
                    status: 'processing'
                }),
            });

            if (response.ok) {
                onStatusUpdate();
                Alert.alert('Success', 'Order status updated successfully');
            } else {
                Alert.alert('Error', 'Failed to update order status');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to connect to server');
        }
    };

    // Format date to Pakistan time
    const formatDate = (dateString: string) => {
        const options: Intl.DateTimeFormatOptions = {
            timeZone: 'Asia/Karachi',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        };
        return new Date(dateString).toLocaleString('en-PK', options);
    };

    return (
        <View style={styles.orderContainer}>
            <Text style={styles.orderText}>Order #{order._id.slice(-6)}</Text>
            <Text style={styles.customerText}>Customer: {order.customerDetails.name}</Text>
            <Text style={styles.addressText} numberOfLines={2}>
                Address: {order.customerDetails.location.address}
            </Text>
            <Text style={styles.statusText}>Status: {order.status}</Text>
            <Text style={styles.dateText}>Ordered: {formatDate(order.createdAt)}</Text>
            <View style={styles.buttonsContainer}>
                <Link href={{
                    pathname: "/(appPages)/(Admin)/OrderDetails",
                    params: { orderId: order._id }
                }} asChild>
                    <TouchableOpacity style={styles.detailsButton}>
                        <Text style={styles.detailsButtonText}>View Details</Text>
                    </TouchableOpacity>
                </Link>
                {order.status === 'pending' && (
                    <TouchableOpacity style={styles.processButton} onPress={handleProcessOrder}>
                        <FontAwesome6 style={styles.icon} name="check" size={16} color="black" />
                        <Text style={styles.processButtonText}> Mark as processing</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );
};

const ViewOrdersScreen = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/orders`);   
            if (response.ok) {
                const data = await response.json();
                setOrders(data.orders || []);
            } else {
                Alert.alert('Error', 'Failed to fetch orders');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to connect to server');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const handleBackPress = () => {
        router.back();
    };

    return (
        <View style={styles.container}>
            <View style={styles.innerContainer}>
                <AntDesign onPress={handleBackPress} name="arrowleft" size={26} color="#4E1365" style={styles.backArrow} />
                <Text style={styles.headerText}>View Orders</Text>
                <View style={styles.ordersContainer}>
                    {isLoading ? (
                        <View style={styles.centerContent}>
                            <Text style={styles.loadingText}>Loading orders...</Text>
                        </View>
                    ) : orders.length === 0 ? (
                        <View style={styles.centerContent}>
                            <Text style={styles.noOrdersText}>No orders found</Text>
                        </View>
                    ) : (
                        <ScrollView>
                            {orders.map((order) => (
                                <OrderItem key={order._id} order={order} onStatusUpdate={fetchOrders} />
                            ))}
                        </ScrollView>
                    )}
                </View>
            </View>
        </View>
    );
};

const additionalStyles = StyleSheet.create({
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
    },
    loadingText: {
        fontSize: 18,
        color: '#4E1365',
    },
    noOrdersText: {
        fontSize: 18,
        color: '#4E1365',
        textAlign: 'center',
    },
    customerText: {
        fontSize: 16,
        color: "#4A006E",
        marginBottom: 4,
    },
    addressText: {
        fontSize: 14,
        color: "#666",
        marginBottom: 4,
    },
    dateText: {
        fontSize: 14,
        color: "#666",
        marginBottom: 8,
        fontStyle: 'italic',
    },
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#4E1365",
        padding: 10
    },
    innerContainer: {
        flexGrow: 1,
        justifyContent: 'center',
        backgroundColor: "#FFFFFF",
        borderRadius: 35,
        overflow: 'hidden',
    },
    backArrow: {
        position: 'absolute',
        top: 23,
        left: 10,
        zIndex: 2,
    },
    headerText: {
        fontSize: 32,
        color: '#4E1365',
        textAlign: 'center',
        padding: 16,
    },
    ordersContainer:{
        backgroundColor: '#45115A',
        paddingTop: 16,
        flex: 1
    },
    orderContainer: {
        backgroundColor: "#FFFFFF",
        borderRadius: 8,
        marginVertical: 16,
        paddingVertical: 16,
        paddingHorizontal: 12,
        elevation: 4,
    },
    orderText: {
        fontSize: 18,
        color: "#4A006E",
        fontWeight: "bold",
        marginBottom: 8,
    },
    statusText: {
        fontSize: 16,
        color: "#4A006E",
        marginBottom: 8,
    },
    buttonsContainer: {
        flexDirection: "row",
        justifyContent: "space-between",
    },
    detailsButton: {
        backgroundColor: "#4A006E",
        borderRadius: 25,
        paddingVertical: 8,
        paddingHorizontal: 20,
    },
    detailsButtonText: {
        color: "#FFFFFF",
        fontWeight: "bold",
    },
    processButton: {
        backgroundColor: "#E6CCE8",
        borderTopRightRadius: 2,
        borderTopLeftRadius: 25,
        borderBottomLeftRadius: 25,
        borderBottomRightRadius: 2,
        paddingVertical: 8,
        paddingHorizontal: 16,
        flexDirection: "row",
        alignItems: "center",
        borderWidth: 1,
        borderColor: "#4E1365"
    },
    processButtonText: {
        color: "#4A006E",
    },
    icon: {
        marginRight: 10
    },
    ...additionalStyles
});

export default ViewOrdersScreen;

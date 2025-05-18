import { useEffect, useState } from "react";
import * as React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, RefreshControl } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { API_BASE_URL } from "@/config/config";
import AsyncStorage from '@react-native-async-storage/async-storage';
import io from 'socket.io-client';

type Order = {
    _id: string;
    orderItems: Array<{
        name: string;
        quantity: number;
        price: number;
    }>;
    totalPrice: number;
    status: string;
    estimatedTime: number;
    createdAt: string;
    customerDetails: {
        name: string;
        phone: string;
        address: string;
        location: {
            coordinates: [number, number];
            address: string;
        };
    };
};

const DeliveryDashboard = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const socket = io(API_BASE_URL);

        socket.on('orderStatusUpdated', (updatedOrder) => {
            setOrders(prevOrders => 
                prevOrders.map(order => 
                    order._id === updatedOrder._id ? updatedOrder : order
                )
            );
        });

        return () => {
            socket.disconnect();
        };
    }, []);

    const fetchProcessingOrders = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/orders`);
            if (response.ok) {
                const data = await response.json();
                const relevantOrders = data.orders.filter(
                    (order: Order) => ['processing', 'out_for_delivery'].includes(order.status)
                );
                setOrders(relevantOrders);
            } else {
                Alert.alert('Error', 'Failed to fetch orders');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to connect to server');
        } finally {
            setIsLoading(false);
        }
    };

    const onRefresh = React.useCallback(() => {
        setRefreshing(true);
        fetchProcessingOrders().then(() => setRefreshing(false));
    }, []);

    useEffect(() => {
        fetchProcessingOrders();
        const interval = setInterval(fetchProcessingOrders, 30000);
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'processing':
                return '#FFA500';
            case 'out_for_delivery':
                return '#4E1365';
            case 'delivered':
                return '#2E7D32';
            case 'cancelled':
                return '#D32F2F';
            default:
                return '#666666';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'processing':
                return 'Processing';
            case 'out_for_delivery':
                return 'Out for Delivery';
            case 'delivered':
                return 'Delivered';
            case 'cancelled':
                return 'Cancelled';
            default:
                return status;
        }
    };

    const handleLogout = async () => {
        try {
            await AsyncStorage.removeItem('userData');
            router.replace('/(auth)/Login');
        } catch (error) {
            Alert.alert('Error', 'Failed to logout');
        }
    };

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
        <View style={styles.container}>
            <View style={styles.innerContainer}>
                <View style={styles.header}>
                    <Text style={styles.headerText}>Delivery Dashboard</Text>
                    <TouchableOpacity onPress={handleLogout} style={styles.logoutButton}>
                        <AntDesign name="logout" size={24} color="#4E1365" />
                    </TouchableOpacity>
                </View>

                <View style={styles.ordersContainer}>
                    {isLoading ? (
                        <View style={styles.centerContent}>
                            <Text style={styles.loadingText}>Loading orders...</Text>
                        </View>
                    ) : orders.length === 0 ? (
                        <View style={styles.centerContent}>
                            <Text style={styles.noOrdersText}>No orders to deliver</Text>
                        </View>
                    ) : (
                        <ScrollView
                            refreshControl={
                                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                            }
                        >
                            {orders.map((order) => (
                                <View key={order._id} style={styles.orderCard}>
                                    <View style={styles.orderHeader}>
                                        <Text style={styles.orderIdText}>Order #{order._id.slice(-6)}</Text>
                                        <View style={[
                                            styles.statusBadge,
                                            { backgroundColor: getStatusColor(order.status) }
                                        ]}>
                                            <Text style={styles.statusText}>
                                                {getStatusText(order.status)}
                                            </Text>
                                        </View>
                                    </View>
                                    <Text style={styles.customerText}>
                                        Customer: {order.customerDetails.name}
                                    </Text>
                                    <Text style={styles.phoneText}>
                                        Phone: {order.customerDetails.phone}
                                    </Text>
                                    <Text style={styles.addressText}>
                                        Address: {order.customerDetails.location.address}
                                    </Text>
                                    <Text style={styles.dateText}>
                                        Ordered: {formatDate(order.createdAt)}
                                    </Text>
                                    <Link 
                                        href={{
                                            pathname: "/(appPages)/(Delivery)/DeliveryOrderDetails",
                                            params: { orderId: order._id }
                                        }} 
                                        asChild
                                    >
                                        <TouchableOpacity style={styles.viewButton}>
                                            <Text style={styles.viewButtonText}>View Details</Text>
                                        </TouchableOpacity>
                                    </Link>
                                </View>
                            ))}
                        </ScrollView>
                    )}
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#4E1365",
        padding: 10,
    },
    innerContainer: {
        flex: 1,
        backgroundColor: "#FFFFFF",
        borderRadius: 35,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
    },
    headerText: {
        fontSize: 24,
        color: '#4E1365',
        fontWeight: 'bold',
    },
    logoutButton: {
        padding: 8,
    },
    ordersContainer: {
        flex: 1,
        backgroundColor: '#45115A',
        padding: 16,
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 18,
        color: '#FFFFFF',
    },
    noOrdersText: {
        fontSize: 18,
        color: '#FFFFFF',
        textAlign: 'center',
    },
    orderCard: {
        backgroundColor: '#FFFFFF',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
        elevation: 3,
    },
    orderHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    orderIdText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4E1365',
        marginBottom: 8,
    },
    customerText: {
        fontSize: 16,
        color: '#333',
        marginBottom: 4,
    },
    phoneText: {
        fontSize: 16,
        color: '#333',
        marginBottom: 4,
    },
    addressText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 4,
    },
    dateText: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
        marginBottom: 12,
    },
    viewButton: {
        backgroundColor: '#4E1365',
        padding: 12,
        borderRadius: 25,
        alignItems: 'center',
    },
    viewButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    statusText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: 'bold',
    },
});

export default DeliveryDashboard; 
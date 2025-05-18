import { useEffect, useState } from "react";
import * as React from "react";
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from "react-native";
import { API_BASE_URL } from "@/config/config";
import { AntDesign } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    deliveryPerson?: {
        name: string;
        phone: string;
        currentLocation?: {
            latitude: number;
            longitude: number;
        };
    };
};

const OrderTracking = () => {
    const [orders, setOrders] = useState<Order[]>([]);
    const [refreshing, setRefreshing] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    const fetchOrders = async () => {
        try {
            setIsLoading(true);
            const userData = await AsyncStorage.getItem('userData');
            if (!userData) {
                console.log('No user data found');
                return;
            }
            
            const { id } = JSON.parse(userData);
            console.log('Fetching orders for userId:', id);

            if (!id) {
                console.error('User ID is undefined');
                return;
            }

            const response = await fetch(`${API_BASE_URL}/user-orders/${id}`);
            console.log('Response status:', response.status);

            const data = await response.json();
            console.log('Response data:', data);

            if (data.success) {
                setOrders(data.orders);
            } else {
                console.error('Failed to fetch orders:', data.message);
            }
        } catch (error) {
            console.error('Error fetching orders:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchOrders();
        setRefreshing(false);
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'pending': return '#FFA000';
            case 'processing': return '#1976D2';
            case 'on_way': return '#7B1FA2';
            case 'delivered': return '#2E7D32';
            default: return '#666666';
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

    const handleOrderPress = (orderId: string) => {
        router.push({
            pathname: "/(appPages)/(User)/OrderTrackingDetails",
            params: { orderId }
        });
    };

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <AntDesign 
                    onPress={() => router.back()} 
                    name="arrowleft" 
                    size={24} 
                    color="#FFF" 
                />
                <Text style={styles.headerTitle}>My Orders</Text>
            </View>

            <ScrollView 
                style={styles.scrollView}
                refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
                }
            >
                {isLoading ? (
                    <View style={styles.centerContent}>
                        <Text style={styles.loadingText}>Loading orders...</Text>
                    </View>
                ) : orders.length === 0 ? (
                    <View style={styles.centerContent}>
                        <Text style={styles.noOrdersText}>No orders found</Text>
                    </View>
                ) : (
                    orders.map((order) => (
                        <TouchableOpacity 
                            key={order._id} 
                            style={styles.orderCard}
                            onPress={() => handleOrderPress(order._id)}
                        >
                            <View style={styles.orderHeader}>
                                <Text style={styles.orderNumber}>Order #{order._id.slice(-6)}</Text>
                                <Text 
                                    style={[
                                        styles.statusBadge,
                                        { backgroundColor: getStatusColor(order.status) }
                                    ]}
                                >
                                    {order.status}
                                </Text>
                            </View>

                            <Text style={styles.dateText}>
                                {formatDate(order.createdAt)}
                            </Text>

                            <View style={styles.itemsContainer}>
                                {order.orderItems.map((item, index) => (
                                    <Text key={index} style={styles.itemText}>
                                        {item.name} x{item.quantity}
                                    </Text>
                                ))}
                            </View>

                            <View style={styles.totalContainer}>
                                <Text style={styles.totalText}>
                                    Total: Rs. {order.totalPrice}
                                </Text>
                            </View>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#4E1365',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        paddingTop: 40,
    },
    headerTitle: {
        fontSize: 20,
        color: '#FFF',
        marginLeft: 16,
        fontWeight: 'bold',
    },
    scrollView: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 16,
    },
    orderCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
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
    orderNumber: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4E1365',
    },
    statusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    dateText: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
    },
    itemsContainer: {
        borderTopWidth: 1,
        borderTopColor: '#EEE',
        paddingTop: 12,
    },
    itemText: {
        fontSize: 14,
        color: '#333',
        marginBottom: 4,
    },
    totalContainer: {
        borderTopWidth: 1,
        borderTopColor: '#EEE',
        marginTop: 12,
        paddingTop: 12,
    },
    totalText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4E1365',
        textAlign: 'right',
    },
    centerContent: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        paddingTop: 50,
    },
    loadingText: {
        fontSize: 16,
        color: '#666',
    },
    noOrdersText: {
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
});

export default OrderTracking; 
import  { useEffect, useState } from "react";
import * as React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from "react-native";
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';
import { AntDesign } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { API_BASE_URL } from "@/config/config";
import MapView, { Marker } from 'react-native-maps';

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
            coordinates: [number, number]; // [longitude, latitude]
            address: string;
        };
    };
};

const OrderDetailsScreen = () => {
    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const params = useLocalSearchParams<{ orderId: string }>();

    useEffect(() => {
        fetchOrderDetails();
    }, []);

    const fetchOrderDetails = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/orders/${params.orderId}`);
            if (response.ok) {
                const data = await response.json();
                setOrder(data);
            } else {
                Alert.alert('Error', 'Failed to fetch order details');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to connect to server');
        } finally {
            setIsLoading(false);
        }
    };

    const handleProcessOrder = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/update-order-status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId: params.orderId,
                    status: 'completed'
                }),
            });

            if (response.ok) {
                Alert.alert('Success', 'Order marked as completed');
                fetchOrderDetails();
            } else {
                Alert.alert('Error', 'Failed to update order status');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to connect to server');
        }
    };

    const handleBackPress = () => {
        router.back();
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
                <AntDesign onPress={handleBackPress} name="arrowleft" size={26} color="#4E1365" style={styles.backArrow} />
                <Text style={styles.headerText}>Order Details</Text>
                <ScrollView style={styles.ordersContainer}>
                    {isLoading ? (
                        <View style={styles.centerContent}>
                            <Text style={styles.loadingText}>Loading order details...</Text>
                        </View>
                    ) : !order ? (
                        <View style={styles.centerContent}>
                            <Text style={styles.noOrderText}>Order not found</Text>
                        </View>
                    ) : (
                        <View style={styles.detailsContainer}>
                            <Text style={styles.orderText}>Order #{order._id.slice(-6)}</Text>
                            <Text style={styles.dateText}>Ordered on: {formatDate(order.createdAt)}</Text>

                            {/* Customer Details Section */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Customer Details</Text>
                                <Text style={styles.detailText}>Name: {order.customerDetails.name}</Text>
                                <Text style={styles.detailText}>Phone: {order.customerDetails.phone}</Text>
                                <Text style={styles.detailText}>Address: {order.customerDetails.location.address}</Text>
                            </View>

                            {/* Order Items Section */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Order Items</Text>
                                {order.orderItems.map((item, index) => (
                                    <Text key={index} style={styles.detailText}>
                                        {item.name} x{item.quantity} - Rs. {item.price * item.quantity}
                                    </Text>
                                ))}
                            </View>

                            {/* Order Summary Section */}
                            <View style={styles.section}>
                                <Text style={styles.sectionTitle}>Order Summary</Text>
                                <Text style={styles.detailText}>Total Price: Rs. {order.totalPrice}</Text>
                                <Text style={styles.detailText}>Status: {order.status}</Text>
                                <Text style={styles.detailText}>Estimated Time: {order.estimatedTime} minutes</Text>
                            </View>

                            {/* Map View */}
                            <View style={styles.mapContainer}>
                                <Text style={styles.sectionTitle}>Delivery Location</Text>
                                <MapView
                                    style={styles.map}
                                    initialRegion={{
                                        latitude: order.customerDetails.location.coordinates[1],
                                        longitude: order.customerDetails.location.coordinates[0],
                                        latitudeDelta: 0.005,
                                        longitudeDelta: 0.005,
                                    }}
                                >
                                    <Marker
                                        coordinate={{
                                            latitude: order.customerDetails.location.coordinates[1],
                                            longitude: order.customerDetails.location.coordinates[0],
                                        }}
                                    />
                                </MapView>
                            </View>

                            {order.status !== 'completed' && (
                                <TouchableOpacity style={styles.processButton} onPress={handleProcessOrder}>
                                    <FontAwesome6 style={styles.icon} name="check" size={16} color="black" />
                                    <Text style={styles.processButtonText}>Mark as completed</Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    )}
                </ScrollView>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#4E1365",
        padding: 10
    },
    innerContainer: {
        flexGrow: 1,
        backgroundColor: "#FFFFFF",
        borderRadius: 35,
    },
    headerText: {
        fontSize: 32,
        color: '#4E1365',
        textAlign: 'center',
        padding: 16,
    },
    backArrow: {
        position: 'absolute',
        top: 23,
        left: 10,
        zIndex: 2,
    },
    ordersContainer:{
        backgroundColor: '#45115A',
        paddingTop: 16,
        flex: 1
    },
    detailsContainer: {
        backgroundColor: "#FFFFFF",
        borderRadius: 8,
        marginVertical: 16,
        padding: 16,
        elevation: 4,
    },
    orderText: {
        fontSize: 20,
        color: "#4E1365",
        fontWeight: "bold",
        marginBottom: 8,
    },
    detailText: {
        fontSize: 16,
        color: "#000000",
        marginBottom: 8,
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
        alignSelf:"flex-end",
        borderWidth: 1,
        borderColor: "#4E1365"
        
    },
    processButtonText: {
        color: "#4A006E",
        fontWeight: "bold",
    },
    icon: {
        marginRight: 10
    },
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
    noOrderText: {
        fontSize: 18,
        color: '#4E1365',
        textAlign: 'center',
    },
    section: {
        marginVertical: 10,
        padding: 10,
        backgroundColor: '#f8f8f8',
        borderRadius: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4E1365',
        marginBottom: 10,
    },
    dateText: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
        marginBottom: 15,
    },
    mapContainer: {
        marginVertical: 15,
        height: 200,
        borderRadius: 8,
        overflow: 'hidden',
    },
    map: {
        flex: 1,
    },
});

export default OrderDetailsScreen;

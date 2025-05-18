import { useEffect, useState } from "react";
import * as React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView, Linking, Platform } from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import { API_BASE_URL } from "@/config/config";
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { io } from 'socket.io-client';
import * as Location from 'expo-location';

type Order = {
    _id: string;
    orderItems: Array<{
        name: string;
        quantity: number;
        price: number;
    }>;
    totalPrice: number;
    status: 'pending' | 'processing' | 'out_for_delivery' | 'delivered' | 'completed' | 'cancelled';
    estimatedTime: number;
    createdAt: string;
    paymentMethod: 'COD' | 'STRIPE';
    paymentStatus: 'pending' | 'paid' | 'failed';
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

const DeliveryOrderDetails = () => {
    const [order, setOrder] = useState<Order | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();
    const params = useLocalSearchParams<{ orderId: string }>();
    const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
    const [locationUpdateInterval, setLocationUpdateInterval] = useState<NodeJS.Timeout | null>(null);

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

    useEffect(() => {
        fetchOrderDetails();
    }, []);

    useEffect(() => {
        const socket = io(`${API_BASE_URL}`, {
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 1000,
            transports: ['websocket']
        });

        socket.on('connect', () => {
            console.log('Connected to socket server');
            socket.emit('joinOrderRoom', params.orderId);
        });

        socket.on('connect_error', (error) => {
            console.error('Socket connection error:', error);
        });

        // Request location permission and start tracking
        const startLocationTracking = async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status !== 'granted') {
                    Alert.alert('Permission Denied', 'Location permission is required for delivery tracking.');
                    return;
                }

                // Start watching position
                const interval = setInterval(async () => {
                    const location = await Location.getCurrentPositionAsync({
                        accuracy: Location.Accuracy.High
                    });

                    setCurrentLocation(location);

                    // Calculate estimated arrival time (example calculation)
                    const estimatedMinutes = calculateEstimatedArrival(
                        location.coords,
                        order?.customerDetails.location.coordinates || [0, 0]
                    );

                    // Emit location update to server
                    socket.emit('updateDeliveryLocation', {
                        orderId: params.orderId,
                        location: {
                            latitude: location.coords.latitude,
                            longitude: location.coords.longitude
                        },
                        estimatedArrival: `${estimatedMinutes} minutes`
                    });
                }, 10000); // Update every 10 seconds

                setLocationUpdateInterval(interval as unknown as NodeJS.Timeout);
            } catch (error) {
                console.error('Error starting location tracking:', error);
                Alert.alert('Error', 'Failed to start location tracking');
            }
        };

        if (order?.status === 'out_for_delivery') {
            startLocationTracking();
        }

        return () => {
            if (locationUpdateInterval) {
                clearInterval(locationUpdateInterval);
            }
            socket.disconnect();
        };
    }, [order?.status]);

    const calculateEstimatedArrival = (
        currentCoords: { latitude: number; longitude: number },
        destinationCoords: [number, number]
    ) => {
        // Simple distance calculation (you might want to use a more sophisticated method)
        const R = 6371; // Earth's radius in km
        const lat1 = currentCoords.latitude * Math.PI / 180;
        const lat2 = destinationCoords[1] * Math.PI / 180;
        const lon1 = currentCoords.longitude * Math.PI / 180;
        const lon2 = destinationCoords[0] * Math.PI / 180;

        const dLat = lat2 - lat1;
        const dLon = lon2 - lon1;

        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(dLon/2) * Math.sin(dLon/2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        const distance = R * c;

        // Assume average speed of 30 km/h
        return Math.round(distance * 2); // Rough estimate in minutes
    };

    const handleCallCustomer = () => {
        if (order?.customerDetails.phone) {
            Linking.openURL(`tel:${order.customerDetails.phone}`);
        }
    };

    const handleOpenMaps = () => {
        if (!order?.customerDetails.location.coordinates) return;
        
        const [longitude, latitude] = order.customerDetails.location.coordinates;
        const label = encodeURIComponent(order.customerDetails.location.address);
        
        const url = Platform.select({
            ios: `comgooglemaps://?q=${latitude},${longitude}&label=${label}`,
            android: `google.navigation:q=${latitude},${longitude}`
        });
        
        const appleMapsUrl = `maps:${latitude},${longitude}`;
        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
        
        if (Platform.OS === 'ios') {
            // Check if Google Maps is installed
            Linking.canOpenURL(url || '').then((supported) => {
                if (supported) {
                    Linking.openURL(url || '');
                } else {
                    // Show option to choose between Apple Maps and Google Maps in browser
                    Alert.alert(
                        'Choose Navigation App',
                        'Which navigation app would you like to use?',
                        [
                            {
                                text: 'Apple Maps',
                                onPress: () => Linking.openURL(appleMapsUrl)
                            },
                            {
                                text: 'Google Maps',
                                onPress: () => Linking.openURL(googleMapsUrl)
                            },
                            {
                                text: 'Cancel',
                                style: 'cancel'
                            }
                        ]
                    );
                }
            }).catch(() => {
                // Fallback to browser if there's an error
                Linking.openURL(googleMapsUrl);
            });
        } else {
            // For Android, directly use Google Maps
            Linking.openURL(url || googleMapsUrl);
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

    const handleStatusUpdate = async (newStatus: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/update-order-status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId: params.orderId,
                    status: newStatus
                }),
            });

            if (response.ok) {
                Alert.alert('Success', 'Order status updated successfully');
                fetchOrderDetails(); // Refresh order details
            } else {
                Alert.alert('Error', 'Failed to update order status');
            }
        } catch (error) {
            Alert.alert('Error', 'Failed to connect to server');
        }
    };

    const renderStatusButtons = () => {
        if (!order) return null;

        switch (order.status) {
            case 'processing':
                return (
                    <TouchableOpacity 
                        style={[styles.statusButton, styles.onWayButton]}
                        onPress={() => handleStatusUpdate('out_for_delivery')}
                    >
                        <Text style={styles.statusButtonText}>Start Delivery (On Way)</Text>
                    </TouchableOpacity>
                );
            case 'out_for_delivery':
                return (
                    <TouchableOpacity 
                        style={[styles.statusButton, styles.deliveredButton]}
                        onPress={() => handleStatusUpdate('delivered')}
                    >
                        <Text style={styles.statusButtonText}>Mark as Delivered</Text>
                    </TouchableOpacity>
                );
            default:
                return null;
        }
    };

    const renderMap = () => {
        if (!order?.customerDetails.location.coordinates) return null;

        return (
            <View style={styles.mapContainer}>
                <Text style={styles.sectionTitle}>Delivery Location</Text>
                <MapView
                    provider={Platform.OS === 'ios' ? PROVIDER_GOOGLE : undefined}
                    style={styles.map}
                    initialRegion={{
                        latitude: order.customerDetails.location.coordinates[1],
                        longitude: order.customerDetails.location.coordinates[0],
                        latitudeDelta: 0.05,
                        longitudeDelta: 0.05,
                    }}
                >
                    {/* Customer Location Marker */}
                    <Marker
                        coordinate={{
                            latitude: order.customerDetails.location.coordinates[1],
                            longitude: order.customerDetails.location.coordinates[0],
                        }}
                        title="Customer Location"
                        pinColor="red"
                    />
                    
                    {/* Delivery Person Location Marker */}
                    {currentLocation && (
                        <Marker
                            coordinate={{
                                latitude: currentLocation.coords.latitude,
                                longitude: currentLocation.coords.longitude,
                            }}
                            title="Your Location"
                            pinColor="blue"
                        />
                    )}
                </MapView>
                <View style={styles.navigationButtonsContainer}>
                    <TouchableOpacity 
                        style={[styles.navigationButton, styles.googleMapsButton]} 
                        onPress={handleOpenMaps}
                    >
                        <AntDesign name="enviromento" size={20} color="#FFF" />
                        <Text style={styles.navigationButtonText}>
                            Navigate to Customer
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    if (isLoading) {
        return (
            <View style={styles.container}>
                <View style={styles.centerContent}>
                    <Text style={styles.loadingText}>Loading order details...</Text>
                </View>
            </View>
        );
    }

    if (!order) {
        return (
            <View style={styles.container}>
                <View style={styles.centerContent}>
                    <Text style={styles.noOrderText}>Order not found</Text>
                </View>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView style={styles.scrollView}>
                <AntDesign
                    onPress={() => router.back()}
                    name="arrowleft"
                    size={26}
                    color="#4E1365"
                    style={styles.backArrow}
                />
                
                <View style={styles.header}>
                    <Text style={styles.headerText}>Order Details</Text>
                </View>

                <View style={styles.contentContainer}>
                    <View style={styles.orderInfo}>
                        <Text style={styles.orderNumber}>Order #{order._id.slice(-6)}</Text>
                        <Text style={styles.statusText}>Status: {order.status}</Text>
                        <Text style={styles.dateText}>
                            Ordered: {formatDate(order.createdAt)}
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Customer Information</Text>
                        <Text style={styles.detailText}>Name: {order.customerDetails.name}</Text>
                        <TouchableOpacity onPress={handleCallCustomer}>
                            <Text style={styles.phoneText}>
                                Phone: {order.customerDetails.phone} (Tap to call)
                            </Text>
                        </TouchableOpacity>
                        <Text style={styles.detailText}>
                            Address: {order.customerDetails.location.address}
                        </Text>
                    </View>

                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>Order Items</Text>
                        {order.orderItems.map((item, index) => (
                            <View key={index} style={styles.orderItem}>
                                <Text style={styles.itemName}>{item.name}</Text>
                                <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                                <Text style={styles.itemPrice}>Rs. {item.price * item.quantity}</Text>
                            </View>
                        ))}
                        <View style={styles.totalContainer}>
                            <Text style={styles.totalText}>Total: Rs. {order.totalPrice}</Text>
                        </View>
                    </View>

                    {renderMap()}

                    {renderStatusButtons()}
                </View>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#4E1365",
    },
    scrollView: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderRadius: 35,
    },
    header: {
        padding: 16,
        alignItems: 'center',
    },
    headerText: {
        fontSize: 24,
        color: '#4E1365',
        fontWeight: 'bold',
    },
    backArrow: {
        position: 'absolute',
        top: 23,
        left: 10,
        zIndex: 2,
    },
    contentContainer: {
        padding: 16,
    },
    section: {
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4E1365',
        marginBottom: 8,
    },
    detailText: {
        fontSize: 16,
        color: '#333',
        marginBottom: 4,
    },
    phoneText: {
        fontSize: 16,
        color: '#4E1365',
        textDecorationLine: 'underline',
        marginBottom: 4,
    },
    itemText: {
        fontSize: 16,
        color: '#333',
        marginBottom: 4,
    },
    totalText: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4E1365',
        marginTop: 8,
    },
    mapContainer: {
        height: 300,
        marginBottom: 16,
    },
    map: {
        flex: 1,
        borderRadius: 8,
        marginBottom: 8,
    },
    navigationButtonsContainer: {
        marginTop: 8,
        gap: 8,
    },
    navigationButton: {
        backgroundColor: '#4E1365',
        padding: 12,
        borderRadius: 25,
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
    },
    googleMapsButton: {
        backgroundColor: '#4285F4',
    },
    navigationButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
        marginLeft: 8,
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
    noOrderText: {
        fontSize: 18,
        color: '#FFFFFF',
    },
    orderInfo: {
        backgroundColor: '#F5F5F5',
        borderRadius: 8,
        padding: 16,
        marginBottom: 16,
    },
    orderNumber: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4E1365',
        marginBottom: 8,
    },
    statusText: {
        fontSize: 16,
        color: '#666',
        marginBottom: 4,
    },
    dateText: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
    },
    orderItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
    },
    itemName: {
        flex: 2,
        fontSize: 16,
        color: '#333',
    },
    itemQuantity: {
        flex: 1,
        fontSize: 16,
        color: '#666',
        textAlign: 'center',
    },
    itemPrice: {
        flex: 1,
        fontSize: 16,
        color: '#4E1365',
        textAlign: 'right',
        fontWeight: 'bold',
    },
    totalContainer: {
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#ddd',
    },
    statusButton: {
        padding: 16,
        borderRadius: 25,
        alignItems: 'center',
        marginTop: 16,
    },
    onWayButton: {
        backgroundColor: '#4E1365',
    },
    deliveredButton: {
        backgroundColor: '#2E7D32',
    },
    statusButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default DeliveryOrderDetails; 
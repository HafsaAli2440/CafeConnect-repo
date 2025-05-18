import { useEffect, useState } from "react";
import * as React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Platform } from "react-native";
import { API_BASE_URL } from "@/config/config";
import { AntDesign } from "@expo/vector-icons";
import { useRouter, useLocalSearchParams } from "expo-router";
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { io } from 'socket.io-client';

type OrderDetails = {
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
    deliveryPerson?: {
        name: string;
        phone: string;
        currentLocation?: {
            latitude: number;
            longitude: number;
        };
    };
};

type LocationUpdate = {
    location: {
        latitude: number;
        longitude: number;
    };
    estimatedArrival: string;
};

const isMapSupported = () => {
    try {
        // Only attempt to use maps on iOS/Android if properly set up
        if (Platform.OS === 'ios' || Platform.OS === 'android') {
            return true;
        }
        return false;
    } catch (error) {
        return false;
    }
};

const OrderTrackingDetails = () => {
    const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
    const [order, setOrder] = useState<OrderDetails | null>(null);
    const [estimatedArrival, setEstimatedArrival] = useState<string>("");
    const router = useRouter();
    const params = useLocalSearchParams<{ orderId: string }>();

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

        socket.on('locationUpdate', (data: LocationUpdate) => {
            console.log('Received location update:', data);
            setOrderDetails((prev) => {
                if (!prev) return null;
                
                return {
                    ...prev,
                    deliveryPerson: prev.deliveryPerson ? {
                        ...prev.deliveryPerson,
                        currentLocation: data.location
                    } : undefined
                };
            });
            setEstimatedArrival(data.estimatedArrival);
        });

        fetchOrderDetails();

        return () => {
            console.log('Disconnecting socket');
            socket.disconnect();
        };
    }, [params.orderId]);

    const fetchOrderDetails = async () => {
        try {
            console.log('Fetching order details for:', params.orderId);
            const response = await fetch(`${API_BASE_URL}/orders/${params.orderId}`);
            const data = await response.json();
            console.log('Order details response:', data);

            if (response.ok) {
                setOrderDetails(data);
                console.log('Order details set:', data);
            } else {
                console.error('Failed to fetch order details:', data.message);
            }
        } catch (error) {
            console.error('Error fetching order details:', error);
        }
    };

    const handleCallDelivery = () => {
        if (orderDetails?.deliveryPerson?.phone) {
            Linking.openURL(`tel:${orderDetails.deliveryPerson.phone}`);
        }
    };

    const openInGoogleMaps = () => {
        if (!orderDetails?.customerDetails?.location?.coordinates) return;
        
        const latitude = orderDetails.customerDetails.location.coordinates[1];
        const longitude = orderDetails.customerDetails.location.coordinates[0];
        const label = encodeURIComponent(orderDetails.customerDetails.location.address);
        
        const url = Platform.select({
            ios: `comgooglemaps://?q=${latitude},${longitude}&label=${label}`,
            android: `google.navigation:q=${latitude},${longitude}`
        });
        
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
        
        // Check if Google Maps is installed
        Linking.canOpenURL(url || '').then((supported) => {
            if (supported) {
                Linking.openURL(url || '');
            } else {
                // If Google Maps is not installed, open in browser
                Linking.openURL(mapsUrl);
            }
        }).catch(() => {
            // Fallback to browser if there's an error
            Linking.openURL(mapsUrl);
        });
    };

    const renderLocationInfo = () => {
        if (!orderDetails?.customerDetails?.location) return null;

        if (isMapSupported()) {
            try {
                return (
                    <View style={styles.mapContainer}>
                        <Text style={styles.cardTitle}>Delivery Location</Text>
                        <MapView
                            provider={Platform.OS === 'ios' ? PROVIDER_GOOGLE : undefined}
                            style={styles.map}
                            initialRegion={{
                                latitude: orderDetails.customerDetails.location.coordinates[1],
                                longitude: orderDetails.customerDetails.location.coordinates[0],
                                latitudeDelta: 0.05,
                                longitudeDelta: 0.05,
                            }}
                        >
                            <Marker
                                coordinate={{
                                    latitude: orderDetails.customerDetails.location.coordinates[1],
                                    longitude: orderDetails.customerDetails.location.coordinates[0],
                                }}
                                title="Delivery Location"
                                pinColor="red"
                            />
                            {orderDetails.deliveryPerson?.currentLocation && (
                                <Marker
                                    coordinate={orderDetails.deliveryPerson.currentLocation}
                                    title="Delivery Person"
                                    pinColor="blue"
                                />
                            )}
                        </MapView>
                        <TouchableOpacity 
                            style={styles.openMapsButton}
                            onPress={openInGoogleMaps}
                        >
                            <AntDesign name="enviromento" size={20} color="#FFF" />
                            <Text style={styles.openMapsButtonText}>Open in Google Maps</Text>
                        </TouchableOpacity>
                    </View>
                );
            } catch (error) {
                console.error('Error rendering map:', error);
                return renderFallbackLocation();
            }
        }

        return renderFallbackLocation();
    };

    const renderFallbackLocation = () => (
        <View style={styles.locationCard}>
            <Text style={styles.cardTitle}>Delivery Location</Text>
            <Text style={styles.detailText}>
                Address: {orderDetails?.customerDetails?.location?.address || 'Address not available'}
            </Text>
            <TouchableOpacity 
                style={styles.openMapsButton}
                onPress={openInGoogleMaps}
            >
                <AntDesign name="enviromento" size={20} color="#FFF" />
                <Text style={styles.openMapsButtonText}>Open in Google Maps</Text>
            </TouchableOpacity>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <AntDesign 
                    onPress={() => router.back()} 
                    name="arrowleft" 
                    size={24} 
                    color="#FFF" 
                />
                <Text style={styles.headerTitle}>Order Details</Text>
            </View>

            <ScrollView style={styles.content}>
                {!orderDetails ? (
                    <View style={styles.centerContent}>
                        <Text style={styles.loadingText}>Loading order details...</Text>
                    </View>
                ) : (
                    <>
                        <View style={styles.statusCard}>
                            <Text style={styles.statusTitle}>Order Status</Text>
                            <Text style={styles.statusText}>{orderDetails.status}</Text>
                            <Text style={styles.estimatedTime}>
                                Estimated Time: {orderDetails.estimatedTime} minutes
                            </Text>
                        </View>

                        <View style={styles.orderDetailsCard}>
                            <Text style={styles.cardTitle}>Order Items</Text>
                            {orderDetails.orderItems.map((item, index) => (
                                <View key={index} style={styles.itemRow}>
                                    <Text style={styles.itemName}>{item.name}</Text>
                                    <Text style={styles.itemQuantity}>x{item.quantity}</Text>
                                    <Text style={styles.itemPrice}>Rs. {item.price * item.quantity}</Text>
                                </View>
                            ))}
                            <View style={styles.totalRow}>
                                <Text style={styles.totalAmount}>Total Amount</Text>
                                <Text style={styles.totalAmount}>Rs. {orderDetails.totalPrice}</Text>
                            </View>
                        </View>

                        <View style={styles.customerCard}>
                            <Text style={styles.cardTitle}>Delivery Details</Text>
                            <Text style={styles.detailText}>
                                Name: {orderDetails.customerDetails.name}
                            </Text>
                            <Text style={styles.detailText}>
                                Address: {orderDetails.customerDetails.location.address}
                            </Text>
                        </View>

                        {orderDetails.deliveryPerson && (
                            <View style={styles.deliveryPersonCard}>
                                <Text style={styles.cardTitle}>Delivery Person</Text>
                                <Text style={styles.deliveryName}>
                                    {orderDetails.deliveryPerson.name}
                                </Text>
                                <Text style={styles.detailText}>
                                    Phone: {orderDetails.deliveryPerson.phone}
                                </Text>
                                {estimatedArrival && (
                                    <Text style={styles.estimatedTime}>
                                        Estimated arrival: {estimatedArrival}
                                    </Text>
                                )}
                                <TouchableOpacity 
                                    style={styles.callButton}
                                    onPress={handleCallDelivery}
                                >
                                    <AntDesign name="phone" size={20} color="#FFF" />
                                    <Text style={styles.callButtonText}>Call Delivery Person</Text>
                                </TouchableOpacity>
                            </View>
                        )}

                        {renderLocationInfo()}
                    </>
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
    content: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        padding: 16,
    },
    statusCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    statusTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4E1365',
        marginBottom: 8,
    },
    statusText: {
        fontSize: 16,
        color: '#333',
        marginBottom: 4,
    },
    estimatedTime: {
        fontSize: 14,
        color: '#666',
        fontStyle: 'italic',
    },
    deliveryPersonCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4E1365',
        marginBottom: 8,
    },
    deliveryName: {
        fontSize: 16,
        color: '#333',
        marginBottom: 12,
    },
    callButton: {
        backgroundColor: '#4E1365',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 25,
    },
    callButtonText: {
        color: '#FFF',
        marginLeft: 8,
        fontSize: 16,
        fontWeight: 'bold',
    },
    mapContainer: {
        height: 300,
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
    },
    map: {
        flex: 1,
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
    orderDetailsCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    itemRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#EEE',
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
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 16,
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: '#EEE',
    },
    totalAmount: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4E1365',
    },
    customerCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    detailText: {
        fontSize: 16,
        color: '#333',
        marginBottom: 8,
    },
    locationCard: {
        backgroundColor: '#FFF',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
    },
    openMapsButton: {
        backgroundColor: '#4E1365',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 12,
        borderRadius: 25,
        marginTop: 10,
    },
    openMapsButtonText: {
        color: '#FFF',
        marginLeft: 8,
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default OrderTrackingDetails; 
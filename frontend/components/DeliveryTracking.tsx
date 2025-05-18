import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import io from 'socket.io-client';

interface DeliveryTrackingProps {
    orderId: string;
    customerLocation: {
        latitude: number;
        longitude: number;
    };
}

const DeliveryTracking: React.FC<DeliveryTrackingProps> = ({
    orderId,
    customerLocation
}) => {
    const [deliveryLocation, setDeliveryLocation] = useState(null);
    
    useEffect(() => {
        const socket = io('your_backend_url');
        
        socket.on('connect', () => {
            socket.emit('trackOrder', orderId);
        });
        
        socket.on('deliveryLocationUpdate', (location) => {
            setDeliveryLocation(location);
        });
        
        return () => {
            socket.disconnect();
        };
    }, [orderId]);

    return (
        <View style={styles.container}>
            <MapView
                provider={PROVIDER_GOOGLE}
                style={styles.map}
                initialRegion={{
                    ...customerLocation,
                    latitudeDelta: 0.05,
                    longitudeDelta: 0.05,
                }}
            >
                <Marker
                    coordinate={customerLocation}
                    title="Delivery Location"
                    pinColor="blue"
                />
                {deliveryLocation && (
                    <Marker
                        coordinate={deliveryLocation}
                        title="Delivery Partner"
                        pinColor="green"
                    />
                )}
            </MapView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 300,
        width: '100%',
    },
    map: {
        flex: 1,
    },
});

export default DeliveryTracking; 
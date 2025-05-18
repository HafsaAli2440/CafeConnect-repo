import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Platform, Dimensions } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';

interface MapPickerProps {
    onLocationSelect: (location: {
        latitude: number;
        longitude: number;
        address: string;
    }) => void;
}

const MapPicker: React.FC<MapPickerProps> = ({ onLocationSelect }) => {
    const [region, setRegion] = useState({
        latitude: 27.7172,
        longitude: 85.3240,
        latitudeDelta: 0.0922,
        longitudeDelta: 0.0421,
    });

    useEffect(() => {
        (async () => {
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                return;
            }

            try {
                const location = await Location.getCurrentPositionAsync({});
                setRegion(prev => ({
                    ...prev,
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                }));
            } catch (error) {
                console.error('Error getting location:', error);
            }
        })();
    }, []);

    const handleRegionChange = async (newRegion: any) => {
        try {
            const [address] = await Location.reverseGeocodeAsync({
                latitude: newRegion.latitude,
                longitude: newRegion.longitude,
            });

            if (address) {
                const formattedAddress = `${address.street || ''} ${address.district || ''} ${address.city || ''} ${address.region || ''} ${address.country || ''}`.trim();
                
                onLocationSelect({
                    latitude: newRegion.latitude,
                    longitude: newRegion.longitude,
                    address: formattedAddress,
                });
            }
        } catch (error) {
            console.error('Error getting address:', error);
        }
    };

    return (
        <View style={styles.container}>
            <MapView
                style={styles.map}
                initialRegion={region}
                onRegionChangeComplete={handleRegionChange}
                showsUserLocation={true}
            >
                <Marker
                    coordinate={{
                        latitude: region.latitude,
                        longitude: region.longitude,
                    }}
                    draggable
                    onDragEnd={(e) => handleRegionChange(e.nativeEvent.coordinate)}
                />
            </MapView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        height: 200,
        width: '100%',
        borderRadius: 8,
        overflow: 'hidden',
    },
    map: {
        width: '100%',
        height: '100%',
    },
});

export default MapPicker; 
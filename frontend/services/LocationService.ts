import * as Location from 'expo-location';
import io from 'socket.io-client';

export class LocationService {
    private socket: any;
    private watchId: any;

    constructor(serverUrl: string) {
        this.socket = io(serverUrl);
    }

    async startSharing(orderId: string) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            throw new Error('Location permission denied');
        }

        this.watchId = await Location.watchPositionAsync(
            {
                accuracy: Location.Accuracy.High,
                timeInterval: 5000,
                distanceInterval: 10,
            },
            (location) => {
                this.socket.emit('updateDeliveryLocation', {
                    orderId,
                    location: {
                        latitude: location.coords.latitude,
                        longitude: location.coords.longitude,
                    },
                });
            }
        );
    }

    stopSharing() {
        if (this.watchId) {
            this.watchId.remove();
        }
        this.socket.disconnect();
    }
} 
        
        
        
        
import AsyncStorage from '@react-native-async-storage/async-storage';


const API_URL = `${API_BASE_URL}`;

export const api = {
    async createOrder(orderData) {
        try {
            const userDataString = await AsyncStorage.getItem('userData');
            const userData = JSON.parse(userDataString);
            
            const response = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${userData.token}` // If you're using JWT
                },
                body: JSON.stringify(orderData),
            });
            return response.json();
        } catch (error) {
            console.error('Error creating order:', error);
            throw error;
        }
    },

    async getOrderStatus(orderId) {
        const response = await fetch(`${API_URL}/orders/${orderId}/status`);
        return response.json();
    },

    async getMenuItems() {
        const response = await fetch(`${API_URL}/menu-items`);
        return response.json();
    },
};

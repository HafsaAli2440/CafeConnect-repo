import { API_BASE_URL } from "@/config/config";

const API_URL = `${API_BASE_URL}`;  // Update this with your actual backend URL

export type PaymentMethod = 'COD' | 'STRIPE';

export interface OrderData {
    userId: string;
    orderItems: Array<{
        id: string;
        name: string;
        price: number;
        quantity: number;
    }>;
    totalPrice: number;
    paymentMethod: PaymentMethod;
    customerDetails: {
        name: string;
        phone: string;
        address: string;
        location: {
            coordinates: [number, number]; // [longitude, latitude]
            address: string;
        };
    };
}

export interface OrderResponse {
    success: boolean;
    clientSecret?: string;
    orderId?: string;
    message?: string;
}

export const api = {
    createOrder: async (orderData: OrderData): Promise<OrderResponse> => {
        try {
            // Validate required fields
            if (!orderData.userId || !orderData.orderItems || !orderData.customerDetails) {
                throw new Error('Missing required fields');
            }

            if (orderData.orderItems.length === 0) {
                throw new Error('Order items cannot be empty');
            }

            const response = await fetch(`${API_URL}/orders`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(orderData),
            });

            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || `HTTP error! status: ${response.status}`);
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },
}; 
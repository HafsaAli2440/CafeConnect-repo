import { Alert } from 'react-native';
import { initStripe, initPaymentSheet, presentPaymentSheet } from '@stripe/stripe-react-native';
import { API_BASE_URL } from '@/config/config';
export const initiateStripePayment = async (amount, userDetails) => {
    try {
        // Initialize Stripe
        await initStripe({
            publishableKey: 'sk_test_51QtQ8yDYarL82dq3ZFVeF9hS26wTMcQayWdOM5wjEnSgl8HUwfKxdPlDgwExnKqoKOvNWeZSuDKKOGDOnGIaFmTT00cSOVrqo1',
        });

        // Create payment intent
        const response = await fetch(`${API_BASE_URL}/create-payment-intent`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: Math.round(amount),
                userDetails
            }),
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Failed to create payment intent');
        }

        // Initialize payment sheet
        const initResponse = await initPaymentSheet({
            merchantDisplayName: 'Cafe Connect',
            paymentIntentClientSecret: data.clientSecret,
            customerEphemeralKeySecret: data.ephemeralKey,
            customerId: data.customer,
            defaultBillingDetails: {
                name: userDetails.name,
            },
            allowsDelayedPaymentMethods: true,
            style: 'automatic'
        });

        if (initResponse.error) {
            throw new Error(initResponse.error.message);
        }

        // Present payment sheet
        const presentResponse = await presentPaymentSheet();
        
        if (presentResponse.error) {
            throw new Error(presentResponse.error.message);
        }

        return { success: true };

    } catch (error) {
        console.error('Stripe payment error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}; 
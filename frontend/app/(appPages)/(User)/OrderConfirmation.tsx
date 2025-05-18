import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { AntDesign } from '@expo/vector-icons';

const OrderConfirmation = () => {
    const params = useLocalSearchParams<{ orderId: string }>();

    return (
        <View style={styles.container}>
            <View style={styles.content}>
                <View style={styles.iconContainer}>
                    <AntDesign name="checkcircle" size={80} color="#4E1365" />
                </View>
                
                <Text style={styles.title}>Order Confirmed!</Text>
                <Text style={styles.orderId}>Order ID: {params.orderId}</Text>
                
                <View style={styles.messageContainer}>
                    <Text style={styles.message}>
                        Thank you for your order. We'll notify you once your order is ready.
                    </Text>
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity 
                        style={styles.trackButton}
                        onPress={() => router.push({
                            pathname: '/(appPages)/(User)/OrderTracking',
                            params: { orderId: params.orderId }
                        })}
                    >
                        <Text style={styles.buttonText}>Track Order</Text>
                    </TouchableOpacity>

                    <TouchableOpacity 
                        style={styles.menuButton}
                        onPress={() => router.push('/(appPages)/(User)/Menu')}
                    >
                        <Text style={styles.buttonText}>Back to Menu</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
    },
    iconContainer: {
        marginBottom: 30,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#4E1365',
        marginBottom: 10,
    },
    orderId: {
        fontSize: 16,
        color: '#666',
        marginBottom: 20,
    },
    messageContainer: {
        backgroundColor: '#f8f8f8',
        borderRadius: 10,
        padding: 20,
        marginBottom: 30,
        width: '100%',
    },
    message: {
        fontSize: 16,
        color: '#333',
        textAlign: 'center',
        lineHeight: 24,
    },
    buttonContainer: {
        width: '100%',
        gap: 15,
    },
    trackButton: {
        backgroundColor: '#4E1365',
        padding: 15,
        borderRadius: 30,
        alignItems: 'center',
    },
    menuButton: {
        backgroundColor: '#28A745',
        padding: 15,
        borderRadius: 30,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default OrderConfirmation; 
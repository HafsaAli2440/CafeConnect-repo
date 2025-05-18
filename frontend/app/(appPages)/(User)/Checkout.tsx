import { StyleSheet, Text, View, FlatList, TouchableOpacity, Alert, StatusBar, Image, Button, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { Picker } from '@react-native-picker/picker';
import { TextInput } from 'react-native';
import { useStripe, CardField, CardFieldInput, confirmPayment } from '@stripe/stripe-react-native';
import { router, useRouter, useLocalSearchParams } from "expo-router";
import { AntDesign, MaterialIcons } from "@expo/vector-icons";

import { SetStateAction, useState, useEffect } from 'react';
import { api, OrderData, PaymentMethod } from '../../../utils/api';
import * as React  from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapPicker from "@/components/MapPicker";


const OrderDetails = () => {
    const params = useLocalSearchParams<{ orderDetails: string }>();
    const orderDetails = JSON.parse(params.orderDetails);
    const [userDetails, setUserDetails] = useState({
        name: '',
        address: '',
        phone: '',
        location: {
            latitude: 0,
            longitude: 0,
            address: ''
        }
    });
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('COD'); // Default to COD
    const [userId, setUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { confirmPayment } = useStripe();
    const [cardDetails, setCardDetails] = useState<CardFieldInput.Details | null>(null);
 
    useEffect(() => {
        // Get user ID from AsyncStorage
        const getUserData = async () => {
            try {
                const userDataString = await AsyncStorage.getItem('userData');
                console.log("Raw userData from AsyncStorage:", userDataString);
                
                if (userDataString) {
                    const userData = JSON.parse(userDataString);
                    console.log("Parsed userData:", userData);
                    
                    if (userData.id) {
                        setUserId(userData.id);
                        console.log("Set userId to:", userData.id);
                    } else {
                        console.warn("No user ID found in userData");
                        router.push('/(auth)/Login');
                    }
                } else {
                    console.warn("No userData found in AsyncStorage");
                    router.push('/(auth)/Login');
                }
            } catch (error) {
                console.error('Error getting user data:', error);
                router.push('/(auth)/Login');
            }
        };
        getUserData();
    }, []);

    // Debugging: Log the orderDetails to check the values
    console.log("Order Details:", orderDetails);

    const totalPrice = orderDetails.reduce((sum: any, item: { price: any; quantity: number; }) => 
        sum + (item.price * item.quantity), 0);

    const handlePlaceOrder = async () => {
        if (!validateInputs()) return;

        // Check if we have a valid userId
        if (!userId) {
            Alert.alert('Error', 'Please log in to place an order');
            router.push('/(auth)/Login');
            return;
        }

        setIsLoading(true);
        try {
            // Log the orderDetails to see what we're working with
            console.log("Current orderDetails:", orderDetails);
            console.log("Current userId:", userId);

            // Create orderData with the actual orderDetails
            const orderData: OrderData = {
                userId: userId,
                orderItems: orderDetails.map((item: { id: any; name: any; price: string; quantity: string; }) => ({
                    id: item.id,
                    name: item.name,
                    price: parseFloat(item.price),
                    quantity: parseInt(item.quantity)
                })),
                totalPrice: parseFloat(totalPrice.toFixed(2)),
                paymentMethod: paymentMethod,
                customerDetails: {
                    name: userDetails.name.trim(),
                    phone: userDetails.phone.trim(),
                    address: userDetails.address.trim(),
                    location: {
                        coordinates: [userDetails.location.longitude, userDetails.location.latitude],
                        address: userDetails.location.address
                    }
                }
            };

            // Log the final orderData being sent
            console.log('Attempting to place order with data:', orderData);

            const response = await api.createOrder(orderData);
            console.log('Order placement response:', response);

            if (response.success) {
                if (paymentMethod === 'COD') {
                    Alert.alert(
                        'Success',
                        'Order placed successfully!',
                        [{
                            text: 'OK',
                            onPress: () => {
                                router.push('/(appPages)/(User)/OrderConfirmation');
                            }
                        }]
                    );
                } else if (paymentMethod === 'STRIPE' && response.clientSecret) {
                    if (!cardDetails?.complete) {
                        Alert.alert('Error', 'Please complete card details');
                        return;
                    }

                    try {
                        console.log('Starting payment confirmation...');
                        console.log('Client secret:', response.clientSecret);

                        const { error, paymentIntent } = await confirmPayment(
                            response.clientSecret,
                            {
                                paymentMethodType: 'Card',
                                paymentMethodData: {
                                    billingDetails: {
                                        name: userDetails.name.trim(),
                                        phone: userDetails.phone.trim(),
                                        address: {
                                            line1: userDetails.address.trim(),
                                        },
                                    },
                                },
                            }
                        );

                        console.log('Payment result:', { error, paymentIntent });

                        if (error) {
                            console.error('Payment error:', error);
                            Alert.alert('Payment failed', error.message || 'An error occurred during payment');
                            return;
                        }

                        if (paymentIntent && paymentIntent.status === 'Succeeded') {
                            Alert.alert(
                                'Success',
                                'Payment and order processed successfully!',
                                [{
                                    text: 'OK',
                                    onPress: () => {
                                        router.push('/(appPages)/(User)/OrderConfirmation');
                                    }
                                }]
                            );
                        }
                    } catch (error) {
                        console.error('Stripe error:', error);
                        Alert.alert('Error', 'Payment processing failed. Please try again.');
                    }
                }
            } else {
                throw new Error(response.message || 'Failed to place order');
            }
        } catch (error) {
            console.error('Error placing order:', error);
            Alert.alert('Error', 'Failed to place order. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const validateInputs = () => {
        if (!userDetails.name.trim()) {
            Alert.alert('Error', 'Please enter your name');
            return false;
        }
        if (!userDetails.phone.trim()) {
            Alert.alert('Error', 'Please enter your phone number');
            return false;
        }
        if (!userDetails.address.trim()) {
            Alert.alert('Error', 'Please enter your delivery address');
            return false;
        }
        if (!orderDetails || orderDetails.length === 0) {
            Alert.alert('Error', 'Your cart is empty');
            return false;
        }
        return true;
    };

    const OrderItem = ({ item }: { item: { quantity: number; name: string; price: number; id: string } }) => {
        const itemTotal = item.price * item.quantity;
        return (
            <View style={styles.orderItem}>
                <View style={styles.itemInfo}>
                    <View style={styles.quantityBadge}>
                        <Text style={styles.quantityText}>x{item.quantity}</Text>
                    </View>
                    <View style={styles.itemDetails}>
                        <Text style={styles.itemName}>{item.name}</Text>
                        <Text style={styles.itemPrice}>Rs. {item.price}</Text>
                    </View>
                </View>
                <Text style={styles.itemTotal}>Rs. {itemTotal}</Text>
            </View>
        );
    };

    return (
        <KeyboardAvoidingView 
            style={styles.container}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
        >
            <StatusBar barStyle="light-content" />
            <View style={[styles.header, { backgroundColor: '#4E1365' }]}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
                    <AntDesign name="arrowleft" size={24} color="#FFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Checkout</Text>
            </View>

            <ScrollView 
                style={styles.scrollView} 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
            >
                <View style={styles.content}>
                    {/* Order Summary Section */}
                    <View style={styles.orderSummary}>
                        <Text style={styles.sectionTitle}>Order Summary</Text>
                        <FlatList
                            data={orderDetails}
                            renderItem={({ item }) => <OrderItem item={item} />}
                            keyExtractor={(item) => item.id}
                            showsVerticalScrollIndicator={false}
                            style={styles.orderList}
                            scrollEnabled={false}
                        />
                    </View>

                    {/* Bill Details Section */}
                    <View style={styles.billDetails}>
                        <Text style={styles.sectionTitle}>Bill Details</Text>
                        <View style={styles.billItem}>
                            <Text style={styles.billLabel}>Item Total</Text>
                            <Text style={styles.billValue}>Rs. {totalPrice}</Text>
                        </View>
                        <View style={styles.billItem}>
                            <Text style={styles.billLabel}>Delivery Fee</Text>
                            <Text style={styles.billValue}>Rs. 0</Text>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.totalRow}>
                            <Text style={styles.totalLabel}>Total Amount</Text>
                            <Text style={styles.totalAmount}>Rs. {totalPrice}</Text>
                        </View>
                    </View>

                    {/* Customer Details Section */}
                    <View style={styles.customerDetails}>
                        <Text style={styles.sectionTitle}>Customer Details</Text>
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Full Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your full name"
                                value={userDetails.name}
                                onChangeText={(text) => setUserDetails(prev => ({ ...prev, name: text }))}
                            />
                        </View>
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Delivery Address</Text>
                            <TextInput
                                style={[styles.input, styles.multilineInput]}
                                placeholder="Enter your delivery address"
                                value={userDetails.address}
                                onChangeText={(text) => setUserDetails(prev => ({ ...prev, address: text }))}
                                multiline
                                numberOfLines={3}
                            />
                        </View>
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Phone Number</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Enter your phone number"
                                value={userDetails.phone}
                                onChangeText={(text) => setUserDetails(prev => ({ ...prev, phone: text }))}
                                keyboardType="phone-pad"
                            />
                        </View>
                        <View style={styles.inputContainer}>
                            <Text style={styles.inputLabel}>Select Location</Text>
                            <MapPicker
                                onLocationSelect={(location) => {
                                    setUserDetails(prev => ({
                                        ...prev,
                                        location: location,
                                        address: location.address
                                    }));
                                }}
                            />
                        </View>
                    </View>

                    {/* Payment Method Section */}
                    <View style={styles.paymentSection}>
                        <Text style={styles.sectionTitle}>Payment Method</Text>
                        <View style={styles.paymentOptions}>
                            <TouchableOpacity
                                style={[
                                    styles.paymentOption,
                                    paymentMethod === 'COD' && styles.selectedPayment
                                ]}
                                onPress={() => setPaymentMethod('COD' as PaymentMethod)}
                            >
                                <MaterialIcons
                                    name="payments"
                                    size={24}
                                    color={paymentMethod === 'COD' ? '#4E1365' : '#666'}
                                />
                                <Text style={[
                                    styles.paymentText,
                                    paymentMethod === 'COD' && styles.selectedPaymentText
                                ]}>Cash on Delivery</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={[
                                    styles.paymentOption,
                                    paymentMethod === 'STRIPE' && styles.selectedPayment
                                ]}
                                onPress={() => setPaymentMethod('STRIPE' as PaymentMethod)}
                            >
                                <MaterialIcons
                                    name="credit-card"
                                    size={24}
                                    color={paymentMethod === 'STRIPE' ? '#4E1365' : '#666'}
                                />
                                <Text style={[
                                    styles.paymentText,
                                    paymentMethod === 'STRIPE' && styles.selectedPaymentText
                                ]}>Pay by Card</Text>
                            </TouchableOpacity>
                        </View>
                        
                        {paymentMethod === 'STRIPE' && (
                            <View style={styles.cardFieldContainer}>
                                <Text style={styles.inputLabel}>Card Details</Text>
                                <CardField
                                    postalCodeEnabled={false}
                                    placeholders={{
                                        number: '4242 4242 4242 4242',
                                    }}
                                    cardStyle={{
                                        backgroundColor: '#FFFFFF',
                                        textColor: '#000000',
                                        borderWidth: 1,
                                        borderColor: '#ddd',
                                        borderRadius: 8,
                                    }}
                                    style={{
                                        width: '100%',
                                        height: 50,
                                        marginVertical: 10,
                                    }}
                                    onCardChange={(cardDetails) => {
                                        console.log('Card details:', cardDetails);
                                        setCardDetails(cardDetails);
                                    }}
                                    onFocus={(focusedField) => {
                                        console.log('Focused field:', focusedField);
                                    }}
                                    autofocus={false}
                                />
                            </View>
                        )}
                    </View>
                </View>
            </ScrollView>

            <View style={styles.footer}>
                <TouchableOpacity 
                    style={styles.confirmButton}
                    onPress={handlePlaceOrder}
                    disabled={isLoading}
                >
                    <MaterialIcons name="restaurant" size={24} color="#FFF" />
                    <Text style={styles.confirmButtonText}>Place Order</Text>
                </TouchableOpacity>
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#F8F8F8',
    },
    scrollView: {
        flex: 1,
    },
    header: {
        paddingTop: (StatusBar.currentHeight || 0) + 10,
        paddingBottom: 15,
        paddingHorizontal: 20,
    },
    backButton: {
        marginBottom: 10,
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#FFF',
    },
    content: {
        padding: 20,
        paddingBottom: 100, // Add extra padding at the bottom for the footer
    },
    orderSummary: {
        backgroundColor: '#FFF',
        borderRadius: 15,
        padding: 15,
        marginBottom: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 15,
    },
    orderList: {
        maxHeight: '50%',
    },
    orderItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    itemInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    quantityBadge: {
        backgroundColor: '#4E1365',
        borderRadius: 12,
        width: 24,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    quantityText: {
        color: '#FFF',
        fontSize: 12,
        fontWeight: 'bold',
    },
    itemDetails: {
        flex: 1,
    },
    itemName: {
        fontSize: 16,
        color: '#333',
    },
    itemPrice: {
        fontSize: 14,
        color: '#666',
    },
    itemTotal: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4E1365',
    },
    billDetails: {
        backgroundColor: '#FFF',
        borderRadius: 15,
        padding: 15,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    billItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 10,
    },
    billLabel: {
        fontSize: 14,
        color: '#666',
    },
    billValue: {
        fontSize: 14,
        color: '#333',
    },
    divider: {
        height: 1,
        backgroundColor: '#F0F0F0',
        marginVertical: 10,
    },
    totalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 5,
    },
    totalLabel: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    totalAmount: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#4E1365',
    },
    footer: {
        backgroundColor: '#FFF',
        padding: 20,
        borderTopWidth: 1,
        borderTopColor: '#F0F0F0',
    },
    confirmButton: {
        backgroundColor: '#4E1365',
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 15,
        borderRadius: 30,
        elevation: 3,
    },
    confirmButtonText: {
        color: '#FFF',
        fontSize: 18,
        fontWeight: 'bold',
        marginLeft: 10,
    },
    customerDetails: {
        backgroundColor: '#FFF',
        borderRadius: 15,
        padding: 15,
        marginBottom: 20,
    },
    inputContainer: {
        marginBottom: 15,
    },
    inputLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 5,
        fontWeight: '500',
    },
    input: {
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: '#fff',
    },
    multilineInput: {
        height: 80,
        textAlignVertical: 'top',
    },
    paymentSection: {
        backgroundColor: '#FFF',
        borderRadius: 15,
        padding: 15,
        marginBottom: 20,
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    paymentOptions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    paymentOption: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 15,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        marginHorizontal: 5,
    },
    selectedPayment: {
        borderColor: '#4E1365',
        backgroundColor: '#F8E6F3',
    },
    paymentText: {
        marginLeft: 8,
        fontSize: 16,
        color: '#666',
    },
    selectedPaymentText: {
        color: '#4E1365',
        fontWeight: '600',
    },
    cardFieldContainer: {
        marginTop: 15,
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#ddd',
        backgroundColor: '#fff',
    },
});

export default OrderDetails;

import { AntDesign } from "@expo/vector-icons";
import { router } from "expo-router";
import  { useState, useEffect } from "react";
import * as React from "react";
import { MenuItem, MenuItemWithImage } from '../../../types';
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    Image,
    TouchableOpacity,
    ScrollView,
    Dimensions,
    Alert,
    NativeSyntheticEvent,
    ImageSourcePropType,
} from "react-native";
import { API_BASE_URL } from "@/config/config";

const getImageUrl = (imagePath: any): string | undefined => {
    if (!imagePath || typeof imagePath === 'number') return undefined;
    
    // Remove /api from the API_BASE_URL for image URLs
    const baseUrl = API_BASE_URL.replace('/api', '');
    
    // Handle different image path formats
    if (typeof imagePath === 'string') {
        if (imagePath.startsWith('http')) {
            return imagePath;
        }
        
        // Ensure the path starts with a slash
        const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
        return `${baseUrl}${cleanPath}`;
    }
    
    // Handle object with uri property
    if (typeof imagePath === 'object' && 'uri' in imagePath) {
        const uri = imagePath.uri;
        if (typeof uri === 'string') {
            if (uri.startsWith('http')) {
                return uri;
            }
            
            // Ensure the path starts with a slash
            const cleanPath = uri.startsWith('/') ? uri : `/${uri}`;
            return `${baseUrl}${cleanPath}`;
        }
    }
    
    return undefined;
};

const MenuCard = ({ item, updateQuantity }: { item: MenuItemWithImage, updateQuantity: (id: string, quantity: number) => void }) => {
    const [quantity, setQuantity] = useState(0);
    const [imageError, setImageError] = useState(false);

    const handleIncrement = () => {
        const newQuantity = quantity + 1;
        setQuantity(newQuantity);
        updateQuantity(item._id, newQuantity);
    };

    const handleDecrement = () => {
        const newQuantity = Math.max(quantity - 1, 0);
        setQuantity(newQuantity);
        updateQuantity(item._id, newQuantity);
    };

    return (
        <View style={styles.card}>
            <View style={styles.imageContainer}>
                <Image 
                    source={
                        imageError || !item.image 
                            ? require("../../../assets/images/placeholder.jpg")
                            : { uri: getImageUrl(item.image) || '' }
                    }
                    style={styles.image}
                    resizeMode="cover"
                    onError={(e: NativeSyntheticEvent<{ error: string }>) => {
                        console.log('Image loading error for:', item.name, e.nativeEvent.error);
                        console.log('Attempted URL:', item.image ? getImageUrl(item.image) : 'No image path');
                        setImageError(true);
                    }}
                />
            </View>
            <View style={styles.cardContent}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.description} numberOfLines={2}>
                    {item.description}
                </Text>
                <Text style={styles.price}>Rs. {item.price}</Text>
                <View style={styles.quantityContainer}>
                    <View style={styles.counterContainer}>
                        <TouchableOpacity onPress={handleDecrement} style={[styles.button, { borderRightWidth: 1 }]}>
                            <Text style={styles.buttonText}>-</Text>
                        </TouchableOpacity>
                        <Text style={styles.counter}>{quantity}</Text>
                        <TouchableOpacity onPress={handleIncrement} style={[styles.button, { borderLeftWidth: 1 }]}>
                            <Text style={styles.buttonText}>+</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </View>
    );
};

export default function Menu() {
    const deviceHeight = Dimensions.get("window").height;
    const [orderDetails, setOrderDetails] = useState<{ [key: string]: number }>({});
    const [menuItems, setMenuItems] = useState<MenuItemWithImage[]>([]);

    useEffect(() => {
        fetchMenuItems();
    }, []);

    const fetchMenuItems = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/menu-items`);
            const data = await response.json();
            
            if (data.success) {
                const availableItems = data.menuItems
                    .filter((item: MenuItem) => item.isAvailable)
                    .map((item: MenuItem) => ({
                        ...item,
                        image: item.image // Store the raw image path
                    }));
                
                console.log('Processed menu items:', availableItems);
                setMenuItems(availableItems);
            }
        } catch (error) {
            console.error('Error fetching menu items:', error);
            Alert.alert('Error', 'Failed to load menu items');
        }
    };

    const updateQuantity = (id: string, quantity: number) => {
        setOrderDetails((prev) => ({ ...prev, [id]: quantity }));
    };

    const handleSubmitOrder = () => {
        const order = menuItems
            .filter((item) => orderDetails[item._id] > 0)
            .map((item) => ({
                id: item._id,
                name: item.name,
                quantity: orderDetails[item._id],
                price: item.price,
            }));

        if (order.length === 0) {
            Alert.alert("No items selected", "Please add items to your order before submitting.");
            return;
        }

        router.push({
            pathname: '/(appPages)/(User)/Checkout',
            params: { orderDetails: JSON.stringify(order) },
        });
    };

    return (
        <View style={[styles.container, { height: deviceHeight }]}>
            <ScrollView
                style={styles.innerContainer}
                contentContainerStyle={{ paddingBottom: 20 }}
                showsVerticalScrollIndicator={false}
            >
                <AntDesign 
                    onPress={() => router.back()} 
                    name="arrowleft" 
                    size={26} 
                    color="#4E1365" 
                    style={styles.backArrow} 
                />
                <Text style={styles.title}>Menu</Text>
                <FlatList
                    data={menuItems}
                    keyExtractor={(item) => item._id}
                    renderItem={({ item }) => (
                        <MenuCard item={item} updateQuantity={updateQuantity} />
                    )}
                    numColumns={2}
                    scrollEnabled={false}
                    contentContainerStyle={styles.list}
                />
            </ScrollView>
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmitOrder}>
                <Text style={styles.submitButtonText}>Submit Order</Text>
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    innerContainer: {
        flex: 1,
        padding: 20,
    },
    backArrow: {
        marginBottom: 20,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20,
        color: '#4E1365',
    },
    list: {
        gap: 15,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 15,
        overflow: 'hidden',
        elevation: 3,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        marginHorizontal: 5,
        marginBottom: 15,
        width: Dimensions.get('window').width * 0.42,
    },
    imageContainer: {
        width: '100%',
        height: 120,
        backgroundColor: '#f0f0f0',
        overflow: 'hidden',
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
    },
    image: {
        width: '100%',
        height: '100%',
        backgroundColor: '#f0f0f0',
    },
    cardContent: {
        padding: 10,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4E1365',
        marginBottom: 5,
    },
    description: {
        fontSize: 12,
        color: '#666',
        marginBottom: 5,
    },
    price: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#4E1365',
        marginBottom: 10,
    },
    quantityContainer: {
        alignItems: 'center',
    },
    counterContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#4E1365',
        borderRadius: 25,
        overflow: 'hidden',
    },
    button: {
        paddingHorizontal: 15,
        paddingVertical: 8,
        borderColor: '#4E1365',
    },
    buttonText: {
        color: '#4E1365',
        fontSize: 16,
        fontWeight: 'bold',
    },
    counter: {
        paddingHorizontal: 15,
        fontSize: 16,
        color: '#4E1365',
    },
    submitButton: {
        backgroundColor: '#4E1365',
        padding: 15,
        borderRadius: 30,
        margin: 20,
    },
    submitButtonText: {
        color: 'white',
        textAlign: 'center',
        fontSize: 18,
        fontWeight: 'bold',
    },
});

import { AntDesign } from "@expo/vector-icons";
import { router, useNavigation } from "expo-router";
import  { useState, useEffect } from "react";
import * as React from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Image,
  Switch,
  FlatList,
  ImageProps,
  Alert,
  ImageSourcePropType,
} from "react-native";
import { MenuItem, Category, MenuItemWithImage } from '../../../types';
import { API_BASE_URL } from "@/config/config";

//const categories = ["Starter", "Main Course", "Dessert", "Drinks"];

interface MenuCardProps {
  item: MenuItemWithImage;
  onToggle: (id: string) => void;
  onRemove: (id: string) => void;
  onUpdateCategory: (id: string, categoryId: string) => void;
  categories: Category[];
}

const MenuCard = ({ item, onToggle, onRemove, onUpdateCategory, categories }: MenuCardProps) => {
  const [showCategories, setShowCategories] = useState(false);

  const getCategoryName = () => {
    if (typeof item.category === 'string') {
      const category = categories.find(cat => cat._id === item.category);
      return category?.name || 'Unknown';
    }
    return item.category.name;
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Image source={item.image} style={styles.cardImage} />
        <TouchableOpacity style={styles.editButton}>
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
      </View>
      <Text style={styles.label}>Category</Text>
      <View style={styles.relativeContainer}>
        <TouchableOpacity
          style={styles.input}
          onPress={() => setShowCategories(!showCategories)}
        >
          <Text style={{ color: "#4E1365", fontSize: 18 }}>
            {getCategoryName()}
          </Text>
        </TouchableOpacity>
        {showCategories && (
          <View style={styles.dropdown}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat._id}
                onPress={() => {
                  onUpdateCategory(item._id, cat._id);
                  setShowCategories(false);
                }}
              >
                <Text style={styles.dropdownItem}>{cat.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
      <Text style={styles.label}>Price</Text>
      <TextInput
        style={styles.input}
        defaultValue={item.price.toString()}
        placeholderTextColor="#A679B2"
        keyboardType="numeric"
      />
      <View style={styles.cardFooter}>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => onRemove(item._id)}
        >
          <Text style={styles.removeText}>Remove</Text>
        </TouchableOpacity>
        <View style={styles.switchContainer}>
          <Switch
            value={item.isAvailable}
            onValueChange={() => onToggle(item._id)}
            thumbColor={item.isAvailable ? "#4A0072" : "#E0E0E0"}
            trackColor={{ false: "#A679B2", true: "#CBB3E8" }}
          />
          <Text style={styles.switchLabel}>Available</Text>
        </View>
      </View>
    </View>
  );
};

export default function MenuEdit() {
  const [menuItems, setMenuItems] = useState<MenuItemWithImage[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const navigation = useNavigation();

  // Add focus listener to refresh data when screen is focused
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchMenuItems();
      fetchCategories();
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, [navigation]);

  // Initial fetch
  useEffect(() => {
    fetchMenuItems();
    fetchCategories();
  }, []);

  const fetchMenuItems = async () => {
    try {
      // const response = await fetch('http://localhost:3000/api/menu-items/all');
      const response = await fetch(`${API_BASE_URL}/menu-items/all`);
      const data = await response.json();
      if (data.success) {
        const itemsWithImages = data.menuItems
          .map((item: MenuItem) => ({
            ...item,
           // image: { uri: `http://localhost:3000${item.image}` }
            image: { uri: `http://192.168.0.111:3000${item.image}` }
          }))
          .sort((a:any, b:any) => {
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
        setMenuItems(itemsWithImages);
      }
    } catch (error) {
      console.error('Error fetching menu items:', error);
      Alert.alert('Error', 'Failed to load menu items');
    }
  };

  const fetchCategories = async () => {
    try {
      // const response = await fetch('http://localhost:3000/api/categories');
      const response = await fetch(`${API_BASE_URL}/categories`);
      const data = await response.json();
      if (data.success) {
        setCategories(data.categories);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const toggleAvailability = async (id: string) => {
    try {
      const item = menuItems.find(item => item._id === id);
      if (!item) return;

      // const response = await fetch(`http://localhost:3000/api/menu-items/${id}`, {
      const response = await fetch(`${API_BASE_URL}/menu-items/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isAvailable: !item.isAvailable
        }),
      });

      const data = await response.json();
      if (data.success) {
        fetchMenuItems();
      }
    } catch (error) {
      console.error('Error toggling availability:', error);
      Alert.alert('Error', 'Failed to update item');
    }
  };

  const removeItem = async (id: string) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // const response = await fetch(`http://localhost:3000/api/menu-items/${id}`, {
              const response = await fetch(`${API_BASE_URL}/menu-items/${id}`, {
                method: 'DELETE'
              });

              const data = await response.json();
              if (data.success) {
                fetchMenuItems();
                Alert.alert('Success', 'Item deleted successfully');
              } else {
                Alert.alert('Error', data.message || 'Failed to delete item');
              }
            } catch (error) {
              console.error('Error deleting item:', error);
              Alert.alert('Error', 'Failed to delete item');
            }
          }
        }
      ]
    );
  };

  const updateCategory = async (id: string, categoryId: string) => {
    try {
      // const response = await fetch(`http://localhost:3000/api/menu-items/${id}`, {
      const response = await fetch(`${API_BASE_URL}/menu-items/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: categoryId
        }),
      });

      const data = await response.json();
      if (data.success) {
        fetchMenuItems();
      }
    } catch (error) {
      console.error('Error updating category:', error);
      Alert.alert('Error', 'Failed to update category');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        <AntDesign
          onPress={() => router.back()}
          name="arrowleft"
          size={26}
          color="#4E1365"
          style={styles.backArrow}
        />
        <Text style={styles.headerText}>Menu</Text>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => router.push('/AddItem')}
        >
          <Text style={styles.addButtonText}>+ Add Item</Text>
        </TouchableOpacity>
        <View style={styles.ordersContainer}>
          <FlatList
            data={menuItems}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <MenuCard
                item={item}
                onToggle={toggleAvailability}
                onRemove={removeItem}
                onUpdateCategory={updateCategory}
                categories={categories}
              />
            )}
            contentContainerStyle={styles.list}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#4E1365",
    padding: 10,
  },
  innerContainer: {
    flexGrow: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 35,
  },
  headerText: {
    fontSize: 32,
    color: "#4E1365",
    textAlign: "center",
    padding: 16,
  },
  backArrow: {
    position: "absolute",
    top: 23,
    left: 10,
    zIndex: 2,
  },
  addButton: {
    backgroundColor: "#4E1365",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    position: "absolute",
    right: 10,
    top: 17,
    width: 110,
  },
  addButtonText: {
    color: "white",
    fontSize: 18,
    fontWeight: "bold",
  },
  ordersContainer: {
    backgroundColor: "#45115A",
    paddingTop: 16,
    paddingHorizontal: 10,
    flex: 1,
  },
  list: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    marginBottom: 15,
    padding: 15,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#4E1365",
    flex: 1,
  },
  cardImage: {
    width: "20%",
    height: 50,
    resizeMode: "contain",
    marginVertical: 2,
    borderRadius: 10,
    overflow: "hidden",
    marginHorizontal: 20,
  },
  editButton: {
    backgroundColor: "#4E1365",
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingVertical: 2,
  },
  editText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  label: {
    fontSize: 22,
    color: "#4A0072",
  },
  input: {
    backgroundColor: "#D9D9D9",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    marginTop: 5,
    fontSize: 18,
    color: "#4E1365",
  },
  relativeContainer:{
    position: 'relative'
  },
  dropdown: {
    backgroundColor: "#FFFFFF",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderColor: "#A679B2",
    borderWidth: 1,
    position: 'absolute',
    top: '100%',
    left: 0,
    width: '100%',
    zIndex: 10,
  },
  dropdownItem: {
    fontSize: 18,
    color: "#4E1365",
    paddingVertical: 5,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  removeButton: {
    backgroundColor: "#4E1365",
    borderRadius: 25,
    paddingHorizontal: 14,
    paddingVertical: 5,
  },
  removeText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  switchContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  switchLabel: {
    fontSize: 14,
    color: "#4A0072",
    marginLeft: 5,
  },
});

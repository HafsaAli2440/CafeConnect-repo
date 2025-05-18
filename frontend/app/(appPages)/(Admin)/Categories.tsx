import { AntDesign } from "@expo/vector-icons";
import { router } from "expo-router";
import  { useState, useEffect } from "react";
import * as React from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Alert,
  TextInput,
} from "react-native";
import { Category } from '../../../types';
import { API_BASE_URL } from "@/config/config";
export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

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
      Alert.alert('Error', 'Failed to load categories');
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.name.trim()) {
      Alert.alert('Error', 'Category name is required');
      return;
    }

    try {
      // const response = await fetch('http://localhost:3000/api/categories', {
      const response = await fetch(`${API_BASE_URL}/addcategories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCategory),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert('Success', 'Category added successfully');
        setNewCategory({ name: '', description: '' });
        setIsAddingCategory(false);
        fetchCategories();
      } else {
        Alert.alert('Error', data.message);
      }
    } catch (error) {
      console.error('Error adding category:', error);
      Alert.alert('Error', 'Failed to add category');
    }
  };

  const handleDeleteCategory = async (id: string) => {
    Alert.alert(
      'Delete Category',
      'Are you sure you want to delete this category?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              // const response = await fetch(`http://localhost:3000/api/categories/${id}`, {
              const response = await fetch(`http://192.168.0.111:3000/api/categories/${id}`, {
                method: 'DELETE',
              });

              const data = await response.json();

              if (data.success) {
                Alert.alert('Success', 'Category deleted successfully');
                fetchCategories();
              } else {
                Alert.alert('Error', data.message);
              }
            } catch (error) {
              console.error('Error deleting category:', error);
              Alert.alert('Error', 'Failed to delete category');
            }
          },
        },
      ]
    );
  };

  const renderCategory = ({ item }: { item: Category }) => (
    <View style={styles.categoryCard}>
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName}>{item.name}</Text>
        <Text style={styles.categoryDescription}>{item.description}</Text>
      </View>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteCategory(item._id)}
      >
        <AntDesign name="delete" size={24} color="#FF0000" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AntDesign
          onPress={() => router.back()}
          name="arrowleft"
          size={26}
          color="#4E1365"
          style={styles.backArrow}
        />
        <Text style={styles.headerText}>Categories</Text>
      </View>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setIsAddingCategory(true)}
      >
        <Text style={styles.addButtonText}>+ Add Category</Text>
      </TouchableOpacity>

      {isAddingCategory && (
        <View style={styles.addCategoryForm}>
          <TextInput
            style={styles.input}
            placeholder="Category Name"
            value={newCategory.name}
            onChangeText={(text) => setNewCategory(prev => ({ ...prev, name: text }))}
          />
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Description (optional)"
            value={newCategory.description}
            onChangeText={(text) => setNewCategory(prev => ({ ...prev, description: text }))}
            multiline
          />
          <View style={styles.formButtons}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={() => {
                setIsAddingCategory(false);
                setNewCategory({ name: '', description: '' });
              }}
            >
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleAddCategory}
            >
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      <FlatList
        data={categories}
        renderItem={renderCategory}
        keyExtractor={(item) => item._id}
        style={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  backArrow: {
    marginRight: 20,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4E1365',
  },
  addButton: {
    backgroundColor: '#4E1365',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  addButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
  },
  categoryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4E1365',
  },
  categoryDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  deleteButton: {
    padding: 10,
  },
  addCategoryForm: {
    backgroundColor: '#F5F5F5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  input: {
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
    fontSize: 16,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  button: {
    padding: 10,
    borderRadius: 8,
    minWidth: 100,
  },
  cancelButton: {
    backgroundColor: '#999',
  },
  saveButton: {
    backgroundColor: '#4E1365',
  },
  buttonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 
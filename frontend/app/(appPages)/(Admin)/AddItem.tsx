import { AntDesign } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import  { useState, useEffect } from "react";
import * as React from "react";
import { Category } from '../../../types';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import * as ImagePicker from 'expo-image-picker';
import { API_BASE_URL } from "@/config/config";
export default function AddItem() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    categoryName: '',
    image: ''
  });
  const [showCategories, setShowCategories] = useState(false);
  const [imagePreview, setImagePreview] = useState('');

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

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        setFormData(prev => ({ ...prev, image: base64Image }));
        
        setImagePreview(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };

  const handleSubmit = async () => {
    try {
      if (!formData.name || !formData.price || !formData.category || !formData.image) {
        Alert.alert('Error', 'Please fill all required fields and select an image');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/menu-items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (data.success) {
        Alert.alert('Success', 'Item added successfully');
        router.back();
      } else {
        Alert.alert('Error', data.message || 'Failed to add item');
      }
    } catch (error) {
      console.error('Error adding item:', error);
      Alert.alert('Error', 'Failed to add item');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.innerContainer}>
        <AntDesign
          onPress={() => router.back()}
          name="arrowleft"
          size={26}
          color="#4E1365"
          style={styles.backArrow}
        />
        <Text style={styles.headerText}>Add New Item</Text>

        <View style={styles.form}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={formData.name}
            onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            placeholder="Item name"
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={formData.description}
            onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
            placeholder="Item description"
            multiline
          />

          <Text style={styles.label}>Price</Text>
          <TextInput
            style={styles.input}
            value={formData.price}
            onChangeText={(text) => setFormData(prev => ({ ...prev, price: text }))}
            placeholder="Item price"
            keyboardType="numeric"
          />

          <Text style={styles.label}>Category</Text>
          <View style={styles.relativeContainer}>
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowCategories(!showCategories)}
            >
              <Text>{formData.categoryName || 'Select Category'}</Text>
            </TouchableOpacity>
            {showCategories && (
              <View style={styles.dropdown}>
                {categories.map((category) => (
                  <TouchableOpacity
                    key={category._id}
                    onPress={() => {
                      setFormData(prev => ({
                        ...prev,
                        category: category._id,
                        categoryName: category.name
                      }));
                      setShowCategories(false);
                    }}
                  >
                    <Text style={styles.dropdownItem}>{category.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.imageButton} onPress={handleImagePick}>
            <Text style={styles.imageButtonText}>
              {formData.image ? 'Change Image' : 'Select Image'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
            <Text style={styles.submitButtonText}>Add Item</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  },
  backArrow: {
    padding: 10,
  },
  headerText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  form: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  relativeContainer: {
    position: 'relative',
  },
  dropdown: {
    position: 'absolute',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 10,
    width: '100%',
    zIndex: 1,
  },
  dropdownItem: {
    padding: 10,
  },
  imageButton: {
    backgroundColor: '#4E1365',
    padding: 15,
    borderRadius: 8,
    marginVertical: 10,
  },
  imageButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: '#4E1365',
    padding: 15,
    borderRadius: 8,
    marginTop: 20,
  },
  submitButtonText: {
    color: 'white',
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 
// App.js
import { AntDesign } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import * as React from "react";
import { StyleSheet, Text, View, TextInput, TouchableOpacity, Image, Dimensions, ActivityIndicator, Alert, ScrollView, Modal, TouchableWithoutFeedback } from "react-native";
import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE_URL } from "@/config/config";

export default function App() {

  const router = useRouter();
  const [userData, setUserData] = useState({
    email: '',
    phoneNumber: '',
    username: '',
    password: '',
    currentPassword: '',
    profilePicture: null
  });
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      console.log('Loading user data...');
      const userDataString = await AsyncStorage.getItem('userData');
      console.log('Stored userData:', userDataString);
      
      if (userDataString) {
        const userData = JSON.parse(userDataString);
        console.log('Parsed user data:', userData);
        
        const finalUserId = userData.id;
        
        if (!finalUserId) {
          console.error('No user ID found in stored data');
          Alert.alert('Error', 'User ID not found. Please login again.');
          router.replace('/(auth)/Login');
          return;
        }

        const response = await fetch(`${API_BASE_URL}/users/${finalUserId}`);
        const userProfile = await response.json();
        console.log('Fetched user profile:', userProfile);
        console.log('Profile picture path:', userProfile.profilePicture);
        console.log('Full profile picture URL:', userProfile.profilePicture ? `${API_BASE_URL}${userProfile.profilePicture}` : 'No profile picture');

        if (response.ok && userProfile) {
          setUserId(finalUserId);
          setUserData({
            email: userProfile.email || '',
            phoneNumber: userProfile.phoneNumber || '',
            username: userProfile.username || '',
            password: '',
            currentPassword: '',
            profilePicture: userProfile.profilePicture || null
          });
        } else {
          console.error('Failed to fetch user profile');
          Alert.alert('Error', 'Failed to load user profile');
          router.replace('/(auth)/Login');
        }
      } else {
        console.error('No user data found');
        Alert.alert(
          'Session Expired',
          'Please login again to continue',
          [{ text: 'OK', onPress: () => router.replace('/(auth)/Login') }]
        );
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      Alert.alert('Error', 'Failed to load user data');
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  const handleImagePick = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled) {
        setLoading(true);
        const formData = new FormData();

        // Get the file extension
        const fileExtension = result.assets[0].uri.split('.').pop();
        const fileName = `profile-${Date.now()}.${fileExtension}`;

        formData.append('profilePicture', {
          uri: result.assets[0].uri,
          type: 'image/jpeg',
          name: fileName,
        } as unknown as Blob);

        console.log('Uploading image...');
        const response = await fetch(`${API_BASE_URL}/users/${userId}/profile-picture`, {
          method: 'PUT',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const data = await response.json();
        console.log('Upload response:', data);

        if (data.success) {
          setUserData(prev => ({
            ...prev,
            profilePicture: data.user.profilePicture
          }));
          Alert.alert('Success', 'Profile picture updated successfully');
        } else {
          Alert.alert('Error', data.message || 'Failed to update profile picture');
        }
      }
    } catch (error) {
      console.error('Error updating profile picture:', error);
      Alert.alert('Error', 'Failed to update profile picture');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!userData.username || !userData.email || !userData.phoneNumber) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      setLoading(true);
      
      const response = await fetch(`${API_BASE_URL}/users/${userId}/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userData.email,
          phoneNumber: userData.phoneNumber,
          username: userData.username,
          ...(userData.password && userData.currentPassword && {
            currentPassword: userData.currentPassword,
            newPassword: userData.password
          })
        }),
      });

      const data = await response.json();
      if (data.success) {
        // Update AsyncStorage with new user data using the correct key
        await AsyncStorage.setItem('userData', JSON.stringify({
          id: userId,
          role: data.user.role,
          username: data.user.username
        }));
        Alert.alert('Success', 'Profile updated successfully');
        setUserData(prev => ({
          ...prev,
          password: '',
          currentPassword: ''
        }));
      } else {
        Alert.alert('Error', data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleImagePress = () => {
    if (userData.profilePicture) {
      setIsImageModalVisible(true);
    }
  };

  const getImageUrl = (profilePicture: string | null) => {
    if (!profilePicture) return null;
    
    // Remove /api from the API_BASE_URL for image URLs
    const baseUrl = API_BASE_URL.replace('/api', '');
    
    // Ensure the URL is correctly formatted
    const cleanPath = profilePicture.startsWith('/') ? profilePicture : `/${profilePicture}`;
    const fullUrl = `${baseUrl}${cleanPath}`;
    console.log('Full image URL:', fullUrl);
    return fullUrl;
  };

  // Add this function to help debug image loading
  const debugImageUrl = (profilePicture: string | null) => {
    if (!profilePicture) {
      console.log('No profile picture URL provided');
      return;
    }
    
    const url = getImageUrl(profilePicture);
    console.log('API_BASE_URL:', API_BASE_URL);
    console.log('Profile picture path:', profilePicture);
    console.log('Constructed URL:', url);
    // Test the URL
    if (url) {
      fetch(url)
        .then(response => {
          console.log('Image URL response status:', response.status);
          if (!response.ok) {
            console.log('Image URL response headers:', response.headers);
          }
        })
        .catch(error => console.error('Error testing image URL:', error));
    }
        
  };

  // Call this in useEffect
  useEffect(() => {
    if (userData.profilePicture) {
      debugImageUrl(userData.profilePicture);
    }
  }, [userData.profilePicture]);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollViewContent}>
        <View style={styles.innerContainer}>
          <AntDesign onPress={handleBackPress} name="arrowleft" size={26} color="#4E1365" style={styles.backArrow} />
          <View style={styles.header}>
            <Image style={styles.headerImg} source={require("../../assets/images/placeholder.jpg")} />
            <Text style={styles.headerTitle}>Edit Profile</Text>
          </View>
          <View style={styles.profilePictureContainer}>
            <TouchableOpacity onPress={handleImagePress}>
              <View style={styles.profileImageWrapper}>
                <Image
                  source={
                    userData.profilePicture
                      ? {
                          uri: getImageUrl(userData.profilePicture),
                          cache: 'reload'
                        }
                      : require("../../assets/images/profile.png")
                  }
                  style={styles.profilePicture}
                  onLoadStart={() => setImageLoading(true)}
                  onLoadEnd={() => setImageLoading(false)}
                  onError={(e) => {
                    console.error('Image loading error:', e.nativeEvent);
                    setImageLoading(false);
                  }}
                />
                {imageLoading && (
                  <View style={styles.imageLoadingContainer}>
                    <ActivityIndicator size="small" color="#4E1365" />
                  </View>
                )}
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.cameraButton} 
              onPress={handleImagePick}
              disabled={loading}
            >
              <Text style={styles.cameraIcon}>📷</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.changePictureText}>Change Profile Picture</Text>
          <View style={styles.inputContainer}>
            <TextInput 
              style={styles.input} 
              placeholder="Your Email" 
              placeholderTextColor="#A679B2" 
              value={userData.email}
              onChangeText={(text) => setUserData(prev => ({ ...prev, email: text }))}
            />
            <TextInput 
              style={styles.input} 
              placeholder="Phone No" 
              placeholderTextColor="#A679B2" 
              value={userData.phoneNumber}
              onChangeText={(text) => setUserData(prev => ({ ...prev, phoneNumber: text }))}
            />
            <TextInput 
              style={styles.input} 
              placeholder="Username" 
              placeholderTextColor="#A679B2" 
              value={userData.username}
              onChangeText={(text) => setUserData(prev => ({ ...prev, username: text }))}
            />
            <TextInput 
              style={styles.input} 
              placeholder="Current Password (if changing password)" 
              placeholderTextColor="#A679B2" 
              secureTextEntry={true}
              value={userData.currentPassword}
              onChangeText={(text) => setUserData(prev => ({ ...prev, currentPassword: text }))}
            />
            <TextInput 
              style={styles.input} 
              placeholder="New Password (leave blank to keep current)" 
              placeholderTextColor="#A679B2" 
              secureTextEntry={true}
              value={userData.password}
              onChangeText={(text) => setUserData(prev => ({ ...prev, password: text }))}
            />
            <TouchableOpacity 
              style={[styles.saveButton, loading && styles.disabledButton]} 
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Modal
        visible={isImageModalVisible}
        transparent={true}
        onRequestClose={() => setIsImageModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setIsImageModalVisible(false)}
          >
            <Text style={styles.closeButtonText}>✕</Text>
          </TouchableOpacity>
          <Image
            source={{ 
              uri: getImageUrl(userData.profilePicture) || '',
              cache: 'reload'
            }}
            style={styles.modalImage}
            resizeMode="contain"
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#4E1365",
    padding: 10,
  },
  backArrow: {
    position: 'absolute',
    top: 23,
    left: 10,
    zIndex: 2,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollViewContent: {
    flexGrow: 1,
  },
  innerContainer: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 35,
    padding: 10,
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerImg: {
    width: 28,
    height: 28,
    marginRight: 10
  },
  headerTitle: {
    fontSize: 24,
    color: "#4E1365",
    marginVertical: 10,
    fontWeight: "bold",
  },
  profilePictureContainer: {
    position: "relative",
    alignItems: 'center',
    marginVertical: 20,
  },
  profileImageWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: "#4E1365",
    backgroundColor: '#f0f0f0',
  },
  profilePicture: {
    width: '100%',
    height: '100%',
  },
  imageLoadingContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.5)',
  },
  cameraButton: {
    position: "absolute",
    bottom: -10,
    right: -10,
    backgroundColor: "#4E1365",
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIcon: {
    fontSize: 24,
    color: "#FFF",
  },
  changePictureText: {
    fontSize: 20,
    color: "#4C4C4C",
    marginBottom: 20,
    textAlign: "center",
  },
  input: {
    backgroundColor: '#D9D9D9',
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
    fontSize: 22,
    color: '#4E1365',
  },
  inputContainer: {
    paddingHorizontal: 15,
  },
  saveButton: {
    backgroundColor: "#4A0072",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
    marginTop: 40,
    alignSelf: 'center'
  },
  disabledButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalImage: {
    width: '90%',
    height: '90%',
    borderRadius: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  closeButtonText: {
    color: 'black',
    fontSize: 20,
    fontWeight: 'bold',
  },
});

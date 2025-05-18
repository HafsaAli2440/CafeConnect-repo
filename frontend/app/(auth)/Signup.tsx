import  { useState } from 'react';
import * as React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
} from 'react-native';
import { AntDesign } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import { API_BASE_URL } from '../../config/config';

export default function SignUpScreen() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    email: '',
    phoneNumber: '',
    username: '',
    password: '',
    role: '',
  });

  const handleSignup = async () => {
    if (!selectedRole) {
      Alert.alert('Error', 'Please select a role (Faculty, Student, or Delivery)');
      return;
    }

    if (!formData.email || !formData.username || !formData.password || !formData.phoneNumber) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    const phoneRegex = /^\d{11}$/;
    if (!phoneRegex.test(formData.phoneNumber)) {
      Alert.alert('Error', 'Please enter a valid 11-digit phone number');
      return;
    }

    try {
      console.log(JSON.stringify(formData, null, 2));
      const response = await fetch(`${API_BASE_URL}/createuser`, {   
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          role: selectedRole.toLowerCase()
        }),
      });

      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', 'Account created successfully!', [
          {
            text: 'OK',
            onPress: () => router.push(`/(auth)/Login?user=${selectedRole}`)
          }
        ]);
      } else {
        Alert.alert('Error', data.message || 'Signup failed. Please try again.');
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert('Error', 'Network error. Please try again.');
    }
  };

  const renderRoleSelection = () => (
    <View style={styles.roleContainer}>
      <Text style={styles.loginText}>Choose Your Role</Text>
      <TouchableOpacity 
        style={[
          styles.roleButton,
          selectedRole === 'Faculty' && styles.selectedRole
        ]}
        onPress={() => setSelectedRole('Faculty')}
      >
        <Text style={[
          styles.roleButtonText,
          selectedRole === 'Faculty' && styles.selectedRoleText
        ]}>Faculty</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[
          styles.roleButton,
          selectedRole === 'Student' && styles.selectedRole
        ]}
        onPress={() => setSelectedRole('Student')}
      >
        <Text style={[
          styles.roleButtonText,
          selectedRole === 'Student' && styles.selectedRoleText
        ]}>Student</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={[
          styles.roleButton,
          selectedRole === 'Delivery' && styles.selectedRole
        ]}
        onPress={() => setSelectedRole('Delivery')}
      >
        <Text style={[
          styles.roleButtonText,
          selectedRole === 'Delivery' && styles.selectedRoleText
        ]}>Delivery Partner</Text>
      </TouchableOpacity>
    </View>
  );

  const getRoleDisplayText = () => {
    if (selectedRole === 'Delivery') {
      return 'Delivery Partner';
    }
    return selectedRole;
  };

  const renderSignupForm = () => (
    <View style={styles.credentialsSection}>
      <Text style={styles.loginText}>Sign Up as {getRoleDisplayText()}</Text>
      <TextInput
        placeholder="Your Email"
        placeholderTextColor="#9E9E9E"
        style={styles.input}
        value={formData.email}
        onChangeText={(text) => setFormData({...formData, email: text})}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Phone Number (11 digits)"
        placeholderTextColor="#9E9E9E"
        style={styles.input}
        value={formData.phoneNumber}
        onChangeText={(text) => {
          const numericValue = text.replace(/[^0-9]/g, '');
          setFormData({...formData, phoneNumber: numericValue});
        }}
        keyboardType="phone-pad"
        maxLength={11}
      />
      <TextInput
        placeholder="Username"
        placeholderTextColor="#9E9E9E"
        style={styles.input}
        value={formData.username}
        onChangeText={(text) => setFormData({...formData, username: text})}
        autoCapitalize="none"
      />
      <TextInput
        placeholder="Password"
        placeholderTextColor="#9E9E9E"
        secureTextEntry
        style={styles.input}
        value={formData.password}
        onChangeText={(text) => setFormData({...formData, password: text})}
      />

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.signupButton}
          onPress={handleSignup}
        >
          <Text style={styles.buttonText}>Sign up</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <Link href={`/(auth)/Login?user=${selectedRole}`} asChild>
          <TouchableOpacity style={styles.loginButton}>
            <Text style={styles.buttonText}>Already have an account? Login</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View style={styles.innerContainer}>
          <AntDesign
            onPress={() => router.back()}
            name="arrowleft"
            size={26}
            color="#4E1365"
            style={styles.backArrow}
          />

          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/images/login_logo.png')}
              style={styles.logo}
            />
          </View>

          {!selectedRole ? renderRoleSelection() : renderSignupForm()}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4E1365',
    padding: 10,
  },
  innerContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 35,
    overflow: 'hidden',
  },
  backArrow: {
    position: 'absolute',
    top: 23,
    left: 10,
    zIndex: 2,
  },
  logoContainer: {
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: 250,
  },
  roleContainer: {
    padding: 20,
    alignItems: 'center',
    paddingBottom: 30,
  },
  roleButton: {
    backgroundColor: '#F0F0F0',
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 30,
    alignItems: 'center',
    width: '70%',
    marginVertical: 10,
    borderWidth: 2,
    borderColor: '#4E1365',
  },
  selectedRole: {
    backgroundColor: '#4E1365',
  },
  roleButtonText: {
    color: '#4E1365',
    fontSize: 20,
    fontWeight: 'bold',
  },
  selectedRoleText: {
    color: '#FFFFFF',
  },
  credentialsSection: {
    paddingHorizontal: 20,
    flex: 1,
  },
  loginText: {
    fontSize: 32,
    color: '#4E1365',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: '#D9D9D9',
    borderRadius: 8,
    padding: 10,
    marginVertical: 10,
    fontSize: 22,
    color: '#4E1365',
  },
  buttonContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  loginButton: {
    backgroundColor: '#4E1365',
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: 'center',
    width: '80%',
    marginTop: 10,
  },
  signupButton: {
    backgroundColor: '#4E1365',
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: 'center',
    width: '80%',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 20,
  },
});

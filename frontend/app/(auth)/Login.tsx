import { AntDesign } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import { useLocalSearchParams } from "expo-router/build/hooks";
import { Image, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import * as React from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../../config/config';
export default function LoginScreen() {
  const router = useRouter();

  const {user} = useLocalSearchParams();

  const [formData, setFormData] = React.useState({
    username: '',
    password: ''
  });

  const handleBackPress = () => {
    router.back();
  };

  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/users/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          role: user
        }),
      });

      const data = await response.json();
      console.log('Login Response:', data);

      if (data.success) {
        // Store user data including ID
        const userData = {
          id: data.user.id,
          username: data.user.username,
          role: data.user.role
        };
        
        console.log('Storing user data:', userData);
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
        
        router.push(`/(appPages)/Welcome?user=${user}`);
      } else {
        alert(data.message || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Network error. Please try again.');
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView 
        contentContainerStyle={[styles.innerContainer, { paddingBottom: 20 }]} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled" // Allows the user to tap outside the input to dismiss the keyboard
      >
        <AntDesign onPress={handleBackPress} name="arrowleft" size={26} color="#4E1365" style={styles.backArrow} />

        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/login_logo.png')}
            style={styles.logo}
          />
        </View>

        <View style={styles.credentialsSection}>
          <Text style={styles.loginText}>Log in</Text>
          <TextInput
            placeholder="Email"
            placeholderTextColor="#9E9E9E"
            style={styles.input}
            value={formData.username}
            autoCapitalize="none"
            keyboardType="email-address"

            onChangeText={(text) => setFormData({...formData, username: text})}
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
              style={styles.loginButton}
              onPress={handleLogin}
            >
              <Text style={styles.buttonText}>Log in</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dividerContainer}>
            <View style={styles.line} />
            <Text style={styles.orText}>or</Text>
            <View style={styles.line} />
          </View>

          <View style={styles.buttonContainer}>
            <Link href={`/(auth)/Signup?user=${user}`} asChild>
              <TouchableOpacity style={styles.signupButton}>
                <Text style={styles.buttonText}>New here? Sign up</Text>
              </TouchableOpacity>
            </Link>
          </View>
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
    flexGrow: 1,
    justifyContent: 'center',
    backgroundColor: "#FFFFFF",
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
  credentialsSection: {
    paddingHorizontal: 20,
  },
  loginText: {
    fontSize: 32,
    color: '#4E1365',
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
    width: '50%',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 20,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 50,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: 'grey',
  },
  orText: {
    color: 'black',
    marginHorizontal: 10,
    fontSize: 20,
  },
  signupButton: {
    backgroundColor: '#4E1365',
    borderRadius: 25,
    paddingVertical: 12,
    alignItems: 'center',
    width: '70%',
  },
});

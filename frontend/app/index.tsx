// app/CafeConnectScreen.js
import { Link } from 'expo-router';
import * as React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';

export default function CafeConnectScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.logoDiv}>
        <View style={styles.logoContainer}>
          <Image source={require('../assets/images/logo.png')} style={styles.logo} />
        </View>
      </View>
      <Link href="/(auth)/User_Select" asChild>
        <TouchableOpacity style={styles.button}>
          <Text style={styles.buttonText}>Get Started</Text>
        </TouchableOpacity>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4E1365',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60
  },
  logoDiv:{
    flex:1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
    backgroundColor: "#FFFFFF",
    borderRadius: 200,
    padding: 15
  },
  logo: {
    width: 280,
    height: 280,
    margin: 5,
  },
  title: {
    fontSize: 24,
    color: '#D8BFD8',
    fontFamily: 'sans-serif',
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: 'white',
    paddingVertical: 16,
    paddingHorizontal: 80,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 5,
  },
  buttonText: {
    fontSize: 16,
    color: '#4B007D',
    fontWeight: 'bold',
  },
});

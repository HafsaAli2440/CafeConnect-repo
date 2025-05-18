import { Link } from 'expo-router';

import * as React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';

export default function SelectUserRole() {
  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        <View style={styles.upperContainer}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Image
                source={require('../../assets/images/logo.png')}
                style={styles.logo}
              />
            </View>
          </View>

          <Text style={styles.selectRoleText}>Select User Role</Text>
        </View>

        <View style={styles.lowerContainer}>
          <Link href={'/(auth)/Login?user=admin'} asChild>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Admin</Text>
            </TouchableOpacity>
          </Link>

          {/* <Link href={'/(auth)/Login?user=customer'} asChild>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Customer</Text>
            </TouchableOpacity>
          </Link> */}
          <Link href={'/(auth)/Login?user=Faculty'} asChild>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Faculty</Text>
            </TouchableOpacity>
          </Link>

          <Link href={'/(auth)/Login?user=Student'} asChild>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Student</Text>
            </TouchableOpacity>
          </Link>
          <Link href={'/(auth)/Login?user=delivery'} asChild>
            <TouchableOpacity style={styles.button}>
              <Text style={styles.buttonText}>Delivery Person</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4E1365',
    padding: 10
  },
  innerContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 35
  },
  upperContainer: {
    backgroundColor: 'rgba(78, 19, 101, 0.7)',
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 20,
    paddingBottom:10
  },
  logoContainer: {
    alignItems: 'center',
  },
  logoCircle: {
    backgroundColor: '#FFFFFF',
    width: 180,
    height: 180,
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: 160,
    height: 160,
  },
  selectRoleText: {
    fontSize: 28,
    color: '#FFFFFF',
  },
  lowerContainer: {
    flex: 2,
    alignItems: 'center',
    paddingVertical:20
  },
  button: {
    backgroundColor: '#4E1365',
    borderRadius: 25,
    paddingVertical: 16,
    width: '80%',
    alignItems: 'center',
    marginVertical: 15,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 20,
  },
});
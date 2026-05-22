import { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';

import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { api } from '../services/api';

import {
  validarEmail,
  validarPassword,
} from '../utils/validations';

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    checkToken();
  }, []);

  async function checkToken() {
    const token = await SecureStore.getItemAsync('token');

    if (token) {
      router.replace('/home');
    }
  }

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }

    if (!validarEmail(email)) {
      Alert.alert('Error', 'Correo inválido');
      return;
    }

    if (!validarPassword(password)) {
      Alert.alert('Error', 'Mínimo 6 caracteres');
      return;
    }

    try {
      const response = await api.post('/auth/login', {
        email: email.trim().toLowerCase(),
        password,
      });

      const token =
        response.data.access_token || response.data.acces_token;

      await SecureStore.setItemAsync('token', token);

      router.replace('/home');
    } catch {
      Alert.alert('Error', 'Credenciales inválidas');
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 26, fontWeight: 'bold' }}>
        Óptica Zeus
      </Text>

      <TextInput
        placeholder="Correo"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
        style={{
          borderWidth: 1,
          padding: 12,
          borderRadius: 8,
          backgroundColor: 'white',
        }}
      />

      <TextInput
        placeholder="Contraseña"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={{
          borderWidth: 1,
          padding: 12,
          borderRadius: 8,
          backgroundColor: 'white',
        }}
      />

      <Button title="Ingresar" onPress={handleLogin} />

      <View style={{ marginTop: 10 }}>
        <Button
          title="Crear cuenta"
          onPress={() => router.push('/registro')}
        />
      </View>
    </View>
  );
}
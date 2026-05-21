import { useEffect, useState } from 'react';
import { View, Text, TextInput, Button, Alert } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { api } from '../services/api';

export default function LoginScreen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  useEffect(() => {
    async function checkToken() {
      const token = await SecureStore.getItemAsync('token');

      if (token) {
        router.replace('/home');
      }
    }

    checkToken();
  }, []);

  async function handleLogin() {
    try {
      const response = await api.post('/auth/login', {
        email,
        password,
      });

      const token = response.data.acces_token;

      await SecureStore.setItemAsync('token', token);

      router.replace('/home');
    } catch (error) {
      console.log('ERROR LOGIN', error);
      Alert.alert('Error', 'Credenciales inválidas o problema de conexión');
    }
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>Login</Text>

      <TextInput
        placeholder="Correo"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        style={{
          borderWidth: 1,
          padding: 12,
          borderRadius: 8,
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
        }}
      />

      <Button title="Ingresar" onPress={handleLogin} />
    </View>
  );
}
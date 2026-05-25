import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';

import { api } from '../services/api';
import { colors, shadows } from '../constants/theme';

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
    <ScrollView
      contentContainerStyle={{
        flexGrow: 1,
        backgroundColor: colors.background,
      }}
    >
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={heroStyle}
      >
        <Image
          source={require('../assets/zeus-logo-rojo.png')}
          style={logoStyle}
          resizeMode="contain"
        />

        <Text style={heroText}>
          Agenda y gestiona tus horas de atención
        </Text>
      </LinearGradient>

      <View style={formCard}>
        <Text style={title}>Iniciar sesión</Text>

        <Text style={subtitle}>
          Ingresa con tu cuenta para acceder a tus citas.
        </Text>

        <TextInput
          placeholder="Correo electrónico"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor={colors.muted}
          style={inputStyle}
        />

        <TextInput
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholderTextColor={colors.muted}
          style={inputStyle}
        />

        <TouchableOpacity onPress={handleLogin} style={primaryButton}>
          <Text style={primaryButtonText}>Ingresar</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.push('/registro')}
          style={secondaryButton}
        >
          <Text style={secondaryButtonText}>
            Crear cuenta de paciente
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const heroStyle = {
  paddingTop: 60,
  paddingBottom: 50,
  paddingHorizontal: 24,
  alignItems: 'center',
  borderBottomLeftRadius: 34,
  borderBottomRightRadius: 34,
} as const;

const logoStyle = {
  width: 170,
  height: 120,
  borderRadius: 22,
} as const;

const heroText = {
  color: 'white',
  marginTop: 18,
  fontSize: 16,
  textAlign: 'center',
  fontWeight: '600',
} as const;

const formCard = {
  backgroundColor: colors.card,
  margin: 20,
  marginTop: 28,
  padding: 20,
  borderRadius: 18,
  borderWidth: 1,
  borderColor: colors.border,
  ...shadows.card,
} as const;

const title = {
  fontSize: 26,
  fontWeight: 'bold',
  color: colors.text,
} as const;

const subtitle = {
  color: colors.muted,
  marginTop: 6,
  marginBottom: 20,
} as const;

const inputStyle = {
  backgroundColor: '#fff',
  borderWidth: 1,
  borderColor: colors.border,
  padding: 14,
  borderRadius: 14,
  marginBottom: 12,
} as const;

const primaryButton = {
  backgroundColor: colors.primary,
  padding: 15,
  borderRadius: 14,
  alignItems: 'center',
  marginTop: 6,
} as const;

const primaryButtonText = {
  color: 'white',
  fontWeight: 'bold',
  fontSize: 16,
} as const;

const secondaryButton = {
  backgroundColor: '#fff',
  padding: 15,
  borderRadius: 14,
  alignItems: 'center',
  marginTop: 12,
  borderWidth: 1,
  borderColor: colors.primary,
} as const;

const secondaryButtonText = {
  color: colors.primary,
  fontWeight: 'bold',
} as const;
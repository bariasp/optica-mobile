import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { api } from '../services/api';
import { colors, shadows } from '../constants/theme';

import {
  validarEmail,
  validarRut,
  formatearRut,
  validarFechaNacimiento,
  validarPassword,
} from '../utils/validations';

export default function CrearPacienteScreen() {
  const [usuario, setUsuario] = useState<any>(null);

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rut, setRut] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');

  useEffect(() => {
    validarAdmin();
  }, []);

  async function validarAdmin() {
    try {
      const res = await api.get('/auth/me');
      setUsuario(res.data);

      if (res.data.rol !== 'ADMIN') {
        Alert.alert('Acceso denegado');
      }
    } catch {
      Alert.alert('Error', 'No se pudo validar usuario');
    }
  }

  async function crearPaciente() {
    if (!nombre || !email || !password || !rut || !fechaNacimiento) {
      Alert.alert('Error', 'Completa todos los campos');
      return;
    }

    if (!validarEmail(email)) {
      Alert.alert('Error', 'Ingresa un correo válido');
      return;
    }

    if (!validarPassword(password)) {
      Alert.alert('Error', 'La contraseña debe tener mínimo 6 caracteres');
      return;
    }

    if (!validarRut(rut)) {
      Alert.alert('Error', 'Ingresa un RUT válido');
      return;
    }

    if (!validarFechaNacimiento(fechaNacimiento, 0, 120)) {
      Alert.alert(
        'Error',
        'Ingresa una fecha de nacimiento real en formato YYYY-MM-DD',
      );
      return;
    }

    try {
      await api.post('/auth/register', {
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        password,
        rol: 'PACIENTE',
        rut: formatearRut(rut),
        fechaNacimiento,
      });

      Alert.alert('Éxito', 'Paciente creado correctamente');

      setNombre('');
      setEmail('');
      setPassword('');
      setRut('');
      setFechaNacimiento('');
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.response?.data?.message ||
          'No se pudo crear. El correo o RUT ya existen.',
      );
    }
  }

  if (usuario && usuario.rol !== 'ADMIN') {
    return (
      <View style={centerStyle}>
        <Text>Acceso restringido</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={heroStyle}
      >
        <Text style={heroTitle}>Crear paciente</Text>
        <Text style={heroSubtitle}>
          Registra un nuevo paciente para gestionar sus citas
        </Text>
      </LinearGradient>

      <View style={formCard}>
        <TextInput
          placeholder="Nombre completo"
          value={nombre}
          onChangeText={setNombre}
          placeholderTextColor={colors.muted}
          style={inputStyle}
        />

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

        <TextInput
          placeholder="RUT ejemplo: 12345678-9"
          value={rut}
          onChangeText={setRut}
          autoCapitalize="characters"
          placeholderTextColor={colors.muted}
          style={inputStyle}
        />

        <TextInput
          placeholder="Fecha nacimiento YYYY-MM-DD"
          value={fechaNacimiento}
          onChangeText={setFechaNacimiento}
          keyboardType="numbers-and-punctuation"
          placeholderTextColor={colors.muted}
          style={inputStyle}
        />

        <TouchableOpacity onPress={crearPaciente} style={primaryButton}>
          <Text style={primaryButtonText}>Crear paciente</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const centerStyle = {
  flex: 1,
  justifyContent: 'center',
  alignItems: 'center',
} as const;

const heroStyle = {
  paddingTop: 46,
  paddingBottom: 34,
  paddingHorizontal: 24,
  borderBottomLeftRadius: 34,
  borderBottomRightRadius: 34,
} as const;

const heroTitle = {
  color: 'white',
  fontSize: 28,
  fontWeight: 'bold',
} as const;

const heroSubtitle = {
  color: 'white',
  marginTop: 8,
  fontSize: 15,
} as const;

const formCard = {
  backgroundColor: colors.card,
  margin: 20,
  padding: 20,
  borderRadius: 18,
  borderWidth: 1,
  borderColor: colors.border,
  ...shadows.card,
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
  marginTop: 8,
} as const;

const primaryButtonText = {
  color: 'white',
  fontWeight: 'bold',
  fontSize: 16,
} as const;
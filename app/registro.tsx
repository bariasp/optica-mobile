import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  Platform,
  Image,
} from 'react-native';

import DateTimePicker from '@react-native-community/datetimepicker';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import { api } from '../services/api';
import { colors, shadows } from '../constants/theme';

import {
  validarEmail,
  validarRut,
  formatearRut,
  validarFechaNacimiento,
  validarPassword,
} from '../utils/validations';

export default function RegistroScreen() {
  const router = useRouter();

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rut, setRut] = useState('');

  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [mostrarCalendario, setMostrarCalendario] = useState(false);

  function formatearFecha(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  async function registrarPaciente() {
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
      Alert.alert('Error', 'Ingresa una fecha de nacimiento real');
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

      Alert.alert(
        'Cuenta creada',
        'Ahora puedes iniciar sesión con tu correo y contraseña',
      );

      router.replace('/');
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.response?.data?.message ||
          'No se pudo crear la cuenta. El correo o RUT ya existen.',
      );
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
          Crea tu cuenta para reservar horas
        </Text>
      </LinearGradient>

      <View style={formCard}>
        <Text style={title}>Registro de paciente</Text>

        <Text style={subtitle}>
          Completa tus datos para comenzar a agendar en Óptica Zeus.
        </Text>

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

        <View style={dateBox}>
          <Text style={dateLabel}>Fecha de nacimiento</Text>

          <Text style={dateValue}>
            {fechaNacimiento || 'No seleccionada'}
          </Text>

          <TouchableOpacity
            onPress={() => setMostrarCalendario(true)}
            style={outlineButton}
          >
            <Text style={outlineButtonText}>Seleccionar fecha</Text>
          </TouchableOpacity>
        </View>

        {mostrarCalendario && (
          <DateTimePicker
            value={
              fechaNacimiento
                ? new Date(`${fechaNacimiento}T00:00:00`)
                : new Date(2000, 0, 1)
            }
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={new Date()}
            minimumDate={new Date(1900, 0, 1)}
            onChange={(event, selectedDate) => {
              if (Platform.OS === 'android') {
                setMostrarCalendario(false);
              }

              if (selectedDate) {
                setFechaNacimiento(formatearFecha(selectedDate));
              }
            }}
          />
        )}

        {Platform.OS === 'ios' && mostrarCalendario && (
          <TouchableOpacity
            onPress={() => setMostrarCalendario(false)}
            style={primaryButton}
          >
            <Text style={primaryButtonText}>Confirmar fecha</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={registrarPaciente} style={primaryButton}>
          <Text style={primaryButtonText}>Crear cuenta</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => router.replace('/')}
          style={secondaryButton}
        >
          <Text style={secondaryButtonText}>Volver al login</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const heroStyle = {
  paddingTop: 55,
  paddingBottom: 38,
  paddingHorizontal: 24,
  alignItems: 'center',
  borderBottomLeftRadius: 34,
  borderBottomRightRadius: 34,
} as const;

const logoStyle = {
  width: 165,
  height: 115,
  borderRadius: 22,
} as const;

const heroText = {
  color: 'white',
  marginTop: 14,
  fontSize: 16,
  textAlign: 'center',
  fontWeight: '600',
} as const;

const formCard = {
  backgroundColor: colors.card,
  margin: 20,
  marginTop: 24,
  padding: 20,
  borderRadius: 18,
  borderWidth: 1,
  borderColor: colors.border,
  ...shadows.card,
} as const;

const title = {
  fontSize: 25,
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

const dateBox = {
  backgroundColor: '#fff',
  borderWidth: 1,
  borderColor: colors.border,
  padding: 14,
  borderRadius: 14,
  marginBottom: 12,
} as const;

const dateLabel = {
  color: colors.muted,
  marginBottom: 6,
} as const;

const dateValue = {
  fontSize: 16,
  fontWeight: 'bold',
  color: colors.text,
  marginBottom: 10,
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

const outlineButton = {
  borderWidth: 1,
  borderColor: colors.primary,
  borderRadius: 12,
  padding: 12,
  alignItems: 'center',
} as const;

const outlineButtonText = {
  color: colors.primary,
  fontWeight: 'bold',
} as const;
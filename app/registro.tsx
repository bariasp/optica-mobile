import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  ScrollView,
} from 'react-native';

import { useRouter } from 'expo-router';
import { api } from '../services/api';

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
    <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, gap: 12 }}>
      <View style={{ marginTop: 40, gap: 12 }}>
        <Text style={{ fontSize: 26, fontWeight: 'bold' }}>
          Crear cuenta
        </Text>

        <Text>
          Registro de paciente para agendar horas en Óptica Zeus.
        </Text>

        <TextInput
          placeholder="Nombre completo"
          value={nombre}
          onChangeText={setNombre}
          style={inputStyle}
        />

        <TextInput
          placeholder="Correo"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          style={inputStyle}
        />

        <TextInput
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={inputStyle}
        />

        <TextInput
          placeholder="RUT ejemplo: 12345678-9"
          value={rut}
          onChangeText={setRut}
          autoCapitalize="characters"
          style={inputStyle}
        />

        <TextInput
          placeholder="Fecha nacimiento YYYY-MM-DD"
          value={fechaNacimiento}
          onChangeText={setFechaNacimiento}
          keyboardType="numbers-and-punctuation"
          style={inputStyle}
        />

        <Button title="Crear cuenta" onPress={registrarPaciente} />

        <Button
          title="Volver al login"
          onPress={() => router.replace('/')}
        />
      </View>
    </ScrollView>
  );
}

const inputStyle = {
  borderWidth: 1,
  padding: 12,
  borderRadius: 8,
  backgroundColor: 'white',
} as const;
import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  Alert,
  ScrollView,
} from 'react-native';

import { api } from '../services/api';

import {
  validarEmail,
  validarRut,
  formatearRut,
  validarPassword,
} from '../utils/validations';

export default function CrearProfesionalScreen() {
  const [usuario, setUsuario] = useState<any>(null);

  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rut, setRut] = useState('');
  const [especialidad, setEspecialidad] = useState('');

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

  async function crearProfesional() {
    if (!nombre || !email || !password || !rut || !especialidad) {
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

    try {
      await api.post('/auth/register', {
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        password,
        rol: 'PROFESIONAL',
        rut: formatearRut(rut),
        especialidad: especialidad.trim(),
      });

      Alert.alert('Éxito', 'Profesional creado correctamente');

      setNombre('');
      setEmail('');
      setPassword('');
      setRut('');
      setEspecialidad('');
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
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Acceso restringido</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
        Crear profesional
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
        placeholder="Especialidad"
        value={especialidad}
        onChangeText={setEspecialidad}
        style={inputStyle}
      />

      <Button title="Crear profesional" onPress={crearProfesional} />
    </ScrollView>
  );
}

const inputStyle = {
  borderWidth: 1,
  padding: 12,
  borderRadius: 8,
  backgroundColor: 'white',
} as const;
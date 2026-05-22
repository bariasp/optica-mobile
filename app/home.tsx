import { useEffect, useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';

import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';
import { api } from '../services/api';

type Usuario = {
  id: number;
  nombre: string;
  email: string;
  rol: string;
};

export default function HomeScreen() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
    cargarUsuario();
  }, []);

  async function cargarUsuario() {
    try {
      const token = await SecureStore.getItemAsync('token');

      if (!token) {
        router.replace('/');
        return;
      }

      const response = await api.get('/auth/me');
      setUsuario(response.data);
    } catch {
      Alert.alert('Error', 'Sesión inválida');
      await SecureStore.deleteItemAsync('token');
      router.replace('/');
    }
  }

  async function handleLogout() {
    await SecureStore.deleteItemAsync('token');
    router.replace('/');
  }

  if (!usuario) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20, gap: 12 }}>
      <Text style={{ fontSize: 26, fontWeight: 'bold' }}>
        Óptica Zeus
      </Text>

      <Text>Hola, {usuario.nombre}</Text>
      <Text>Rol: {usuario.rol}</Text>

      <View style={{ marginTop: 20, gap: 10 }}>
        <Button title="Ver citas" onPress={() => router.push('/citas')} />

        {usuario.rol === 'PACIENTE' && (
          <Button
            title="Reservar hora"
            onPress={() => router.push('/reservar')}
          />
        )}

        {usuario.rol === 'PROFESIONAL' && (
          <>
            <Button
              title="Gestionar agenda"
              onPress={() => router.push('/gestionar-bloqueos')}
            />

            <Button
              title="Panel interno"
              onPress={() => router.push('/panel-interno')}
            />
          </>
        )}

        {usuario.rol === 'ADMIN' && (
          <>
            <Button
              title="Reservar para paciente"
              onPress={() => router.push('/reservar-admin')}
            />

            <Button
              title="Gestionar agenda"
              onPress={() => router.push('/gestionar-bloqueos')}
            />

            <Button
              title="Panel interno"
              onPress={() => router.push('/panel-interno')}
            />

            <Button
              title="Crear paciente"
              onPress={() => router.push('/crear-paciente')}
            />

            <Button
              title="Crear profesional"
              onPress={() => router.push('/crear-profesional')}
            />
          </>
        )}
      </View>

      <View style={{ marginTop: 30 }}>
        <Button title="Cerrar sesión" onPress={handleLogout} />
      </View>
    </View>
  );
}
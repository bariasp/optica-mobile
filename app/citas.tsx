import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Button,
  Alert,
  ScrollView,
} from 'react-native';

import { useRouter, useFocusEffect } from 'expo-router';
import { api } from '../services/api';

type Usuario = {
  rol: string;
};

type Cita = {
  id: number;
  fechaHora: string;
  estado: string;
  paciente?: {
    nombre: string;
  };
  profesional?: {
    nombre: string;
    especialidad: string;
  };
};

export default function CitasScreen() {
  const router = useRouter();

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [citas, setCitas] = useState<Cita[]>([]);

  useEffect(() => {
    validarUsuario();
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (usuario) cargarCitas();
    }, [usuario]),
  );

  async function validarUsuario() {
    try {
      const res = await api.get('/auth/me');
      setUsuario(res.data);
    } catch {
      Alert.alert('Error', 'Sesión inválida');
      router.replace('/');
    }
  }

  async function cargarCitas() {
    try {
      const response = await api.get('/citas');
      setCitas(response.data);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar las citas');
    }
  }

  async function cancelarCita(id: number) {
    try {
      await api.patch(`/citas/${id}/cancelar`);
      Alert.alert('Éxito', 'Cita cancelada');
      cargarCitas();
    } catch {
      Alert.alert('Error', 'No se pudo cancelar la cita');
    }
  }

  function getColorEstado(estado: string) {
    switch (estado) {
      case 'PENDIENTE':
        return '#fff7cc';
      case 'CANCELADA':
        return '#dcdcdc';
      case 'CONFIRMADA':
        return '#c8f7c5';
      default:
        return 'white';
    }
  }

  if (!usuario) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
        Mis citas
      </Text>

      <ScrollView style={{ marginTop: 20 }}>
        {citas.length === 0 ? (
          <Text>No tienes citas registradas.</Text>
        ) : (
          citas.map((cita) => (
            <View
              key={cita.id}
              style={{
                padding: 12,
                borderWidth: 1,
                borderRadius: 8,
                marginBottom: 10,
                backgroundColor: getColorEstado(cita.estado),
              }}
            >
              <Text>ID: {cita.id}</Text>

              <Text>
                Fecha: {new Date(cita.fechaHora).toLocaleString()}
              </Text>

              <Text>Estado: {cita.estado}</Text>

              <Text>
                Paciente: {cita.paciente?.nombre}
              </Text>

              <Text>
                Profesional: {cita.profesional?.nombre} -{' '}
                {cita.profesional?.especialidad}
              </Text>

              {cita.estado === 'PENDIENTE' && (
                <View style={{ marginTop: 10 }}>
                  <Button
                    title="Cancelar cita"
                    onPress={() => cancelarCita(cita.id)}
                  />
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      <Button title="Volver" onPress={() => router.back()} />
    </View>
  );
}
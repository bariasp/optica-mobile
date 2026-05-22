import { useEffect, useState } from 'react';

import {
  View,
  Text,
  Alert,
  ScrollView,
  TouchableOpacity,
  Button,
} from 'react-native';

import { api } from '../services/api';

type Horario = {
  hora: string;
  disponible: boolean;
  bloqueado?: boolean;
  bloqueoId?: number;
};

type Profesional = {
  id: number;
  nombre: string;
  especialidad: string;
};

type Usuario = {
  rol: string;
  profesional?: {
    id: number;
  };
};

export default function GestionarBloqueosScreen() {
  const ahora = new Date();

  const fechaHoy =
    `${ahora.getFullYear()}-` +
    `${String(ahora.getMonth() + 1).padStart(2, '0')}-` +
    `${String(ahora.getDate()).padStart(2, '0')}`;

  const [fecha, setFecha] = useState(fechaHoy);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [profesionalId, setProfesionalId] = useState<number | null>(null);

  useEffect(() => {
    cargarUsuario();
  }, []);

  useEffect(() => {
    if (profesionalId) {
      cargarHorarios();
    }
  }, [fecha, profesionalId]);

  function cambiarDia(dias: number) {
    const nuevaFecha = new Date(fecha + 'T00:00:00');

    nuevaFecha.setDate(nuevaFecha.getDate() + dias);

    const nuevaFechaTexto =
      `${nuevaFecha.getFullYear()}-` +
      `${String(nuevaFecha.getMonth() + 1).padStart(2, '0')}-` +
      `${String(nuevaFecha.getDate()).padStart(2, '0')}`;

    if (nuevaFechaTexto < fechaHoy) return;

    setFecha(nuevaFechaTexto);
  }

  async function cargarUsuario() {
    try {
      const response = await api.get('/auth/me');

      setUsuario(response.data);

      if (response.data.rol === 'PROFESIONAL') {
        setProfesionalId(response.data.profesional.id);
      }

      if (response.data.rol === 'ADMIN') {
        cargarProfesionales();
      }
    } catch {
      Alert.alert('Error', 'No se pudo cargar usuario');
    }
  }

  async function cargarProfesionales() {
    try {
      const response = await api.get('/users/profesionales');
      setProfesionales(response.data);

      if (response.data.length > 0) {
        setProfesionalId(response.data[0].id);
      }
    } catch {
      Alert.alert('Error', 'No se pudieron cargar profesionales');
    }
  }

  async function cargarHorarios() {
    try {
      const response = await api.get(
        `/citas/disponibles?fecha=${fecha}&profesionalId=${profesionalId}`,
      );

      setHorarios(response.data);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar horarios');
    }
  }

  async function bloquearSlot(hora: string) {
    try {
      await api.post('/citas/bloquear-slot', {
        fechaHora: `${fecha}T${hora}:00`,
        profesionalId,
      });

      cargarHorarios();
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'No se pudo bloquear',
      );
    }
  }

  async function desbloquearSlot(bloqueoId: number) {
    try {
      await api.delete(
        `/citas/dias-bloqueados/${bloqueoId}?profesionalId=${profesionalId}`,
      );

      cargarHorarios();
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'No se pudo desbloquear',
      );
    }
  }

  async function bloquearDiaCompleto() {
    try {
      await api.post('/citas/bloquear-dia', {
        fecha,
        profesionalId,
      });

      Alert.alert('Éxito', 'Día bloqueado');
      cargarHorarios();
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'No se pudo bloquear',
      );
    }
  }

  async function desbloquearDiaCompleto() {
    try {
      const bloqueados = horarios.filter(
        (h) => h.bloqueado && h.bloqueoId,
      );

      for (const h of bloqueados) {
        await api.delete(
          `/citas/dias-bloqueados/${h.bloqueoId}?profesionalId=${profesionalId}`,
        );
      }

      Alert.alert('Éxito', 'Día desbloqueado');
      cargarHorarios();
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'No se pudo desbloquear',
      );
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
        Gestionar agenda
      </Text>

      {usuario.rol === 'ADMIN' && (
        <View style={{ marginTop: 20, gap: 10 }}>
          {profesionales.map((p) => (
            <TouchableOpacity
              key={p.id}
              onPress={() => setProfesionalId(p.id)}
              style={{
                padding: 10,
                borderWidth: 1,
                borderRadius: 8,
                backgroundColor:
                  profesionalId === p.id ? '#dbeafe' : 'white',
              }}
            >
              <Text>{p.nombre}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 20 }}>
        <Button title="←" onPress={() => cambiarDia(-1)} />
        <Text>{fecha}</Text>
        <Button title="→" onPress={() => cambiarDia(1)} />
      </View>

      <View style={{ marginTop: 20, gap: 10 }}>
        <Button title="Bloquear día" onPress={bloquearDiaCompleto} />
        <Button title="Desbloquear día" onPress={desbloquearDiaCompleto} />
      </View>

      <ScrollView style={{ marginTop: 20 }}>
        {horarios.map((h) => (
          <TouchableOpacity
            key={h.hora}
            disabled={!h.disponible && !h.bloqueado}
            onPress={() => {
              if (h.bloqueado && h.bloqueoId) {
                desbloquearSlot(h.bloqueoId);
              } else if (h.disponible) {
                bloquearSlot(h.hora);
              }
            }}
            style={{
              padding: 15,
              borderWidth: 1,
              borderRadius: 8,
              marginBottom: 10,
              opacity:
                !h.disponible && !h.bloqueado ? 0.5 : 1,
              backgroundColor: h.bloqueado
                ? '#fecaca'
                : h.disponible
                ? '#dcfce7'
                : '#dcdcdc',
            }}
          >
            <Text style={{ fontSize: 18 }}>{h.hora}</Text>
            <Text>
              {h.bloqueado
                ? 'Bloqueado'
                : h.disponible
                ? 'Disponible'
                : 'Ocupado'}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}
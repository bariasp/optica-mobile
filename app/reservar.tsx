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
};

type Profesional = {
  id: number;
  nombre: string;
  especialidad: string;
};

export default function ReservarScreen() {
  const ahora = new Date();

  const fechaHoy =
    `${ahora.getFullYear()}-` +
    `${String(ahora.getMonth() + 1).padStart(2, '0')}-` +
    `${String(ahora.getDate()).padStart(2, '0')}`;

  const [fecha, setFecha] = useState(fechaHoy);
  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [profesionalSeleccionado, setProfesionalSeleccionado] =
    useState<number | null>(null);

  useEffect(() => {
    cargarProfesionales();
  }, []);

  useEffect(() => {
    if (profesionalSeleccionado) {
      cargarHorarios();
    }
  }, [fecha, profesionalSeleccionado]);

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

  function esHorarioPasado(hora: string) {
    if (fecha !== fechaHoy) return false;

    const ahora = new Date();
    const [h, m] = hora.split(':').map(Number);

    const fechaHorario = new Date();
    fechaHorario.setHours(h, m, 0, 0);

    return fechaHorario.getTime() <= ahora.getTime();
  }

  async function cargarProfesionales() {
    try {
      const response = await api.get('/users/profesionales');
      setProfesionales(response.data);

      if (response.data.length > 0) {
        setProfesionalSeleccionado(response.data[0].id);
      }
    } catch {
      Alert.alert('Error', 'No se pudieron cargar profesionales');
    }
  }

  async function cargarHorarios() {
    try {
      const response = await api.get(
        `/citas/disponibles?fecha=${fecha}&profesionalId=${profesionalSeleccionado}`,
      );

      setHorarios(response.data);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar horarios');
    }
  }

  async function reservarHorario(hora: string) {
    if (!profesionalSeleccionado) return;

    try {
      const fechaHora = `${fecha}T${hora}:00`;

      await api.post('/citas', {
        fechaHora,
        profesionalId: profesionalSeleccionado,
      });

      Alert.alert('Éxito', 'Hora reservada');
      cargarHorarios();
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'No se pudo reservar',
      );
    }
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
        Reservar hora
      </Text>

      <Text style={{ fontSize: 18, marginTop: 20 }}>
        Profesional
      </Text>

      {profesionales.map((p) => (
        <TouchableOpacity
          key={p.id}
          onPress={() => setProfesionalSeleccionado(p.id)}
          style={{
            padding: 12,
            borderWidth: 1,
            borderRadius: 8,
            marginBottom: 10,
            backgroundColor:
              profesionalSeleccionado === p.id ? '#dbeafe' : 'white',
          }}
        >
          <Text style={{ fontWeight: 'bold' }}>{p.nombre}</Text>
          <Text>{p.especialidad}</Text>
        </TouchableOpacity>
      ))}

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          marginTop: 20,
        }}
      >
        <Button title="←" onPress={() => cambiarDia(-1)} />
        <Text>{fecha}</Text>
        <Button title="→" onPress={() => cambiarDia(1)} />
      </View>

      <ScrollView style={{ marginTop: 20 }}>
        {horarios.length === 0 ? (
          <Text>No hay horarios disponibles</Text>
        ) : (
          horarios.map((h) => {
            const pasado = esHorarioPasado(h.hora);
            const disponible = h.disponible && !pasado;

            return (
              <TouchableOpacity
                key={h.hora}
                disabled={!disponible}
                onPress={() => reservarHorario(h.hora)}
                style={{
                  padding: 15,
                  borderWidth: 1,
                  borderRadius: 8,
                  marginBottom: 10,
                  opacity: disponible ? 1 : 0.4,
                  backgroundColor: h.bloqueado
                    ? '#fecaca'
                    : disponible
                    ? 'white'
                    : '#dcdcdc',
                }}
              >
                <Text style={{ fontSize: 18 }}>{h.hora}</Text>

                <Text>
                  {pasado
                    ? 'Horario pasado'
                    : h.bloqueado
                    ? 'Bloqueado'
                    : h.disponible
                    ? 'Disponible'
                    : 'Ocupado'}
                </Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}
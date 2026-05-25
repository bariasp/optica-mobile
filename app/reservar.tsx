import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { api } from '../services/api';
import { colors, shadows } from '../constants/theme';

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

function construirFechaHoraISO(fecha: string, hora: string) {
  const [year, month, day] = fecha.split('-').map(Number);
  const [hours, minutes] = hora.split(':').map(Number);

  return new Date(year, month - 1, day, hours, minutes, 0, 0).toISOString();
}

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
  const [cargando, setCargando] = useState(false);

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
      setCargando(true);

      const response = await api.get(
        `/citas/disponibles?fecha=${fecha}&profesionalId=${profesionalSeleccionado}`,
      );

      setHorarios(response.data);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar horarios');
    } finally {
      setCargando(false);
    }
  }

  async function reservarHorario(hora: string) {
    if (!profesionalSeleccionado) return;

    try {
      const fechaHora = construirFechaHoraISO(fecha, hora);

      await api.post('/citas', {
        fechaHora,
        profesionalId: profesionalSeleccionado,
      });

      Alert.alert('Éxito', 'Hora reservada correctamente');
      cargarHorarios();
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'No se pudo reservar',
      );
    }
  }

  function nombreProfesionalSeleccionado() {
    return profesionales.find((p) => p.id === profesionalSeleccionado);
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={heroStyle}
      >
        <Text style={heroTitle}>Reservar hora</Text>
        <Text style={heroSubtitle}>
          Selecciona profesional, día y horario disponible
        </Text>
      </LinearGradient>

      <View style={contentStyle}>
        <Text style={sectionTitle}>Profesional</Text>

        {profesionales.map((p) => {
          const seleccionado = profesionalSeleccionado === p.id;

          return (
            <TouchableOpacity
              key={p.id}
              onPress={() => setProfesionalSeleccionado(p.id)}
              style={[
                professionalCard,
                seleccionado && professionalCardSelected,
              ]}
            >
              <Text
                style={[
                  professionalName,
                  seleccionado && { color: colors.primary },
                ]}
              >
                {p.nombre}
              </Text>
              <Text style={professionalSpecialty}>{p.especialidad}</Text>
            </TouchableOpacity>
          );
        })}

        <View style={dateCard}>
          <Text style={dateLabel}>Fecha seleccionada</Text>
          <Text style={dateText}>{fecha}</Text>

          <View style={dateControls}>
            <TouchableOpacity
              onPress={() => cambiarDia(-1)}
              style={outlineButton}
            >
              <Text style={outlineButtonText}>← Día anterior</Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => cambiarDia(1)}
              style={outlineButton}
            >
              <Text style={outlineButtonText}>Día siguiente →</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={sectionTitle}>Horarios disponibles</Text>

        {nombreProfesionalSeleccionado() && (
          <Text style={helperText}>
            Para {nombreProfesionalSeleccionado()?.nombre}
          </Text>
        )}

        {cargando ? (
          <View style={emptyCard}>
            <Text>Cargando horarios...</Text>
          </View>
        ) : horarios.length === 0 ? (
          <View style={emptyCard}>
            <Text style={emptyTitle}>No hay horarios disponibles</Text>
            <Text style={emptyText}>
              Prueba con otro día o profesional.
            </Text>
          </View>
        ) : (
          horarios.map((h) => {
            const pasado = esHorarioPasado(h.hora);
            const disponible = h.disponible && !pasado;

            let estado = 'Disponible';

            if (pasado) estado = 'Horario pasado';
            else if (h.bloqueado) estado = 'Bloqueado';
            else if (!h.disponible) estado = 'Ocupado';

            return (
              <TouchableOpacity
                key={h.hora}
                disabled={!disponible}
                onPress={() => reservarHorario(h.hora)}
                style={[
                  horarioCard,
                  pasado || !h.disponible ? horarioDisabled : null,
                  h.bloqueado ? horarioBlocked : null,
                  disponible ? horarioAvailable : null,
                ]}
              >
                <Text style={horarioHora}>{h.hora}</Text>
                <Text style={horarioEstado}>{estado}</Text>
              </TouchableOpacity>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

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

const contentStyle = {
  padding: 20,
} as const;

const sectionTitle = {
  fontSize: 18,
  fontWeight: 'bold',
  color: colors.text,
  marginTop: 18,
  marginBottom: 10,
} as const;

const professionalCard = {
  backgroundColor: colors.card,
  padding: 15,
  borderRadius: 16,
  marginBottom: 10,
  borderWidth: 1,
  borderColor: colors.border,
  ...shadows.card,
} as const;

const professionalCardSelected = {
  borderColor: colors.primary,
  borderWidth: 2,
} as const;

const professionalName = {
  fontSize: 16,
  fontWeight: 'bold',
  color: colors.text,
} as const;

const professionalSpecialty = {
  color: colors.muted,
  marginTop: 4,
} as const;

const dateCard = {
  backgroundColor: colors.card,
  padding: 16,
  borderRadius: 18,
  borderWidth: 1,
  borderColor: colors.border,
  marginTop: 12,
  ...shadows.card,
} as const;

const dateLabel = {
  color: colors.muted,
  fontSize: 13,
} as const;

const dateText = {
  color: colors.text,
  fontSize: 22,
  fontWeight: 'bold',
  marginTop: 4,
} as const;

const dateControls = {
  flexDirection: 'row',
  gap: 10,
  marginTop: 14,
} as const;

const outlineButton = {
  flex: 1,
  borderWidth: 1,
  borderColor: colors.primary,
  borderRadius: 12,
  padding: 12,
  alignItems: 'center',
} as const;

const outlineButtonText = {
  color: colors.primary,
  fontWeight: 'bold',
  fontSize: 12,
} as const;

const helperText = {
  color: colors.muted,
  marginBottom: 10,
} as const;

const horarioCard = {
  padding: 15,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: colors.border,
  marginBottom: 10,
  backgroundColor: colors.card,
  ...shadows.card,
} as const;

const horarioAvailable = {
  borderColor: colors.primary,
} as const;

const horarioDisabled = {
  backgroundColor: colors.disabled,
  opacity: 0.65,
} as const;

const horarioBlocked = {
  backgroundColor: colors.danger,
} as const;

const horarioHora = {
  fontSize: 20,
  fontWeight: 'bold',
  color: colors.text,
} as const;

const horarioEstado = {
  marginTop: 4,
  color: colors.muted,
} as const;

const emptyCard = {
  backgroundColor: colors.card,
  padding: 18,
  borderRadius: 18,
  borderWidth: 1,
  borderColor: colors.border,
  ...shadows.card,
} as const;

const emptyTitle = {
  fontWeight: 'bold',
  fontSize: 17,
  color: colors.text,
} as const;

const emptyText = {
  color: colors.muted,
  marginTop: 5,
} as const;
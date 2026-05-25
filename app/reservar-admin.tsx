import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { api } from '../services/api';
import { colors, shadows } from '../constants/theme';

type Paciente = {
  id: number;
  nombre: string;
  rut: string;
};

type Profesional = {
  id: number;
  nombre: string;
  especialidad: string;
};

type Horario = {
  hora: string;
  disponible: boolean;
  bloqueado?: boolean;
};

type Usuario = {
  rol: string;
};

function construirFechaHoraISO(fecha: string, hora: string) {
  const [year, month, day] = fecha.split('-').map(Number);
  const [hours, minutes] = hora.split(':').map(Number);

  return new Date(year, month - 1, day, hours, minutes, 0, 0).toISOString();
}

export default function ReservarAdminScreen() {
  const ahora = new Date();

  const fechaHoy =
    `${ahora.getFullYear()}-` +
    `${String(ahora.getMonth() + 1).padStart(2, '0')}-` +
    `${String(ahora.getDate()).padStart(2, '0')}`;

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [fecha, setFecha] = useState(fechaHoy);

  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [pacienteSeleccionado, setPacienteSeleccionado] =
    useState<Paciente | null>(null);

  const [profesionales, setProfesionales] = useState<Profesional[]>([]);
  const [profesionalSeleccionado, setProfesionalSeleccionado] =
    useState<Profesional | null>(null);

  const [horarios, setHorarios] = useState<Horario[]>([]);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    validarAdmin();
  }, []);

  useEffect(() => {
    if (pacienteSeleccionado && profesionalSeleccionado) {
      cargarHorarios();
    }
  }, [fecha, pacienteSeleccionado, profesionalSeleccionado]);

  async function validarAdmin() {
    try {
      const response = await api.get('/auth/me');

      setUsuario(response.data);

      if (response.data.rol !== 'ADMIN') {
        Alert.alert(
          'Acceso denegado',
          'Solo administradores pueden acceder aquí',
        );
        return;
      }

      cargarPacientes();
      cargarProfesionales();
    } catch {
      Alert.alert('Error', 'No se pudo validar usuario');
    }
  }

  function cambiarDia(dias: number) {
    const nuevaFecha = new Date(`${fecha}T00:00:00`);

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

  async function cargarPacientes() {
    try {
      const response = await api.get('/users/pacientes');
      setPacientes(response.data);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar pacientes');
    }
  }

  async function cargarProfesionales() {
    try {
      const response = await api.get('/users/profesionales');
      setProfesionales(response.data);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar profesionales');
    }
  }

  async function cargarHorarios() {
    if (!profesionalSeleccionado) return;

    try {
      setCargando(true);

      const response = await api.get(
        `/citas/disponibles?fecha=${fecha}&profesionalId=${profesionalSeleccionado.id}`,
      );

      setHorarios(response.data);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar horarios');
    } finally {
      setCargando(false);
    }
  }

  async function reservarHorario(hora: string) {
    if (!pacienteSeleccionado || !profesionalSeleccionado) return;

    if (esHorarioPasado(hora)) {
      Alert.alert('Error', 'No puedes reservar un horario pasado');
      return;
    }

    try {
  const fechaHora = construirFechaHoraISO(fecha, hora);

  await api.post('/citas', {
    fechaHora,
    profesionalId: profesionalSeleccionado.id,
    pacienteId: pacienteSeleccionado.id,
  });

      Alert.alert('Éxito', 'Hora reservada para paciente');
      cargarHorarios();
    } catch (error: any) {
      Alert.alert(
        'Error',
        error?.response?.data?.message || 'No se pudo reservar la hora',
      );
    }
  }

  function limpiarSeleccion() {
    setPacienteSeleccionado(null);
    setProfesionalSeleccionado(null);
    setHorarios([]);
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
        <Text style={heroTitle}>Reservar para paciente</Text>
        <Text style={heroSubtitle}>
          Selecciona paciente, profesional y horario
        </Text>
      </LinearGradient>

      <View style={contentStyle}>
        {!pacienteSeleccionado && (
          <>
            <Text style={sectionTitle}>Seleccionar paciente</Text>

            {pacientes.map((paciente) => (
              <TouchableOpacity
                key={paciente.id}
                onPress={() => setPacienteSeleccionado(paciente)}
                style={cardStyle}
              >
                <Text style={cardTitle}>{paciente.nombre}</Text>
                <Text style={cardSubtitle}>RUT: {paciente.rut}</Text>
              </TouchableOpacity>
            ))}
          </>
        )}

        {pacienteSeleccionado && !profesionalSeleccionado && (
          <>
            <View style={summaryCard}>
              <Text style={summaryLabel}>Paciente seleccionado</Text>
              <Text style={summaryTitle}>{pacienteSeleccionado.nombre}</Text>
              <Text style={summaryText}>{pacienteSeleccionado.rut}</Text>
            </View>

            <Text style={sectionTitle}>Seleccionar profesional</Text>

            {profesionales.map((profesional) => (
              <TouchableOpacity
                key={profesional.id}
                onPress={() => setProfesionalSeleccionado(profesional)}
                style={cardStyle}
              >
                <Text style={cardTitle}>{profesional.nombre}</Text>
                <Text style={cardSubtitle}>
                  {profesional.especialidad}
                </Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity onPress={limpiarSeleccion} style={secondaryButton}>
              <Text style={secondaryButtonText}>Cambiar paciente</Text>
            </TouchableOpacity>
          </>
        )}

        {pacienteSeleccionado && profesionalSeleccionado && (
          <>
            <View style={summaryCard}>
              <Text style={summaryLabel}>Reserva para</Text>
              <Text style={summaryTitle}>{pacienteSeleccionado.nombre}</Text>
              <Text style={summaryText}>
                Profesional: {profesionalSeleccionado.nombre}
              </Text>
            </View>

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

            <Text style={sectionTitle}>Horarios</Text>

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
              horarios.map((horario) => {
                const pasado = esHorarioPasado(horario.hora);
                const disponibleReal = horario.disponible && !pasado;

                let estadoTexto = 'Disponible';

                if (pasado) estadoTexto = 'Horario pasado';
                else if (horario.bloqueado) estadoTexto = 'Bloqueado';
                else if (!horario.disponible) estadoTexto = 'Ocupado';

                return (
                  <TouchableOpacity
                    key={horario.hora}
                    disabled={!disponibleReal}
                    onPress={() => reservarHorario(horario.hora)}
                    style={[
                      horarioCard,
                      disponibleReal && horarioAvailable,
                      (!disponibleReal || pasado) && horarioDisabled,
                      horario.bloqueado && horarioBlocked,
                    ]}
                  >
                    <Text style={horarioHora}>{horario.hora}</Text>
                    <Text style={horarioEstado}>{estadoTexto}</Text>
                  </TouchableOpacity>
                );
              })
            )}

            <TouchableOpacity
              onPress={() => {
                setProfesionalSeleccionado(null);
                setHorarios([]);
              }}
              style={secondaryButton}
            >
              <Text style={secondaryButtonText}>Cambiar profesional</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={limpiarSeleccion} style={secondaryButton}>
              <Text style={secondaryButtonText}>Cambiar paciente</Text>
            </TouchableOpacity>
          </>
        )}
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
  fontSize: 27,
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

const cardStyle = {
  backgroundColor: colors.card,
  padding: 16,
  borderRadius: 16,
  marginBottom: 12,
  borderWidth: 1,
  borderColor: colors.border,
  ...shadows.card,
} as const;

const cardTitle = {
  fontSize: 17,
  fontWeight: 'bold',
  color: colors.text,
} as const;

const cardSubtitle = {
  color: colors.muted,
  marginTop: 4,
} as const;

const summaryCard = {
  backgroundColor: colors.card,
  padding: 16,
  borderRadius: 18,
  borderWidth: 1,
  borderColor: colors.border,
  ...shadows.card,
} as const;

const summaryLabel = {
  color: colors.muted,
  fontSize: 13,
} as const;

const summaryTitle = {
  color: colors.text,
  fontSize: 20,
  fontWeight: 'bold',
  marginTop: 4,
} as const;

const summaryText = {
  color: colors.muted,
  marginTop: 4,
} as const;

const dateCard = {
  backgroundColor: colors.card,
  padding: 16,
  borderRadius: 18,
  borderWidth: 1,
  borderColor: colors.border,
  marginTop: 14,
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

const secondaryButton = {
  backgroundColor: colors.card,
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
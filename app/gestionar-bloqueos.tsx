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
  const [cargando, setCargando] = useState(false);

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
      setCargando(true);

      const response = await api.get(
        `/citas/disponibles?fecha=${fecha}&profesionalId=${profesionalId}`,
      );

      setHorarios(response.data);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar horarios');
    } finally {
      setCargando(false);
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

  function confirmarBloquearDia() {
    Alert.alert(
      'Bloquear día',
      '¿Quieres bloquear todos los horarios disponibles de este día?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Bloquear', style: 'destructive', onPress: bloquearDiaCompleto },
      ],
    );
  }

  function confirmarDesbloquearDia() {
    Alert.alert(
      'Desbloquear día',
      '¿Quieres desbloquear todos los horarios bloqueados de este día?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Desbloquear', onPress: desbloquearDiaCompleto },
      ],
    );
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
      <View style={centerStyle}>
        <Text>Cargando...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={heroStyle}
      >
        <Text style={heroTitle}>Gestionar agenda</Text>
        <Text style={heroSubtitle}>
          Bloquea horarios o días completos
        </Text>
      </LinearGradient>

      <View style={contentStyle}>
        {usuario.rol === 'ADMIN' && (
          <>
            <Text style={sectionTitle}>Profesional</Text>

            {profesionales.map((p) => {
              const seleccionado = profesionalId === p.id;

              return (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => setProfesionalId(p.id)}
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
          </>
        )}

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

        <View style={actionGrid}>
          <TouchableOpacity
            onPress={confirmarBloquearDia}
            style={dangerAction}
          >
            <Text style={dangerActionText}>Bloquear día</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={confirmarDesbloquearDia}
            style={outlineAction}
          >
            <Text style={outlineActionText}>Desbloquear día</Text>
          </TouchableOpacity>
        </View>

        <Text style={sectionTitle}>Horarios</Text>

        {cargando ? (
          <View style={emptyCard}>
            <Text>Cargando horarios...</Text>
          </View>
        ) : horarios.length === 0 ? (
          <View style={emptyCard}>
            <Text style={emptyTitle}>No hay horarios para mostrar</Text>
            <Text style={emptyText}>
              Selecciona otro día o profesional.
            </Text>
          </View>
        ) : (
          horarios.map((h) => (
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
              style={[
                horarioCard,
                h.bloqueado && horarioBlocked,
                h.disponible && !h.bloqueado && horarioAvailable,
                !h.disponible && !h.bloqueado && horarioDisabled,
              ]}
            >
              <Text style={horarioHora}>{h.hora}</Text>

              <Text style={horarioEstado}>
                {h.bloqueado
                  ? 'Bloqueado'
                  : h.disponible
                  ? 'Disponible'
                  : 'Ocupado'}
              </Text>
            </TouchableOpacity>
          ))
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

const actionGrid = {
  flexDirection: 'row',
  gap: 10,
  marginTop: 14,
} as const;

const dangerAction = {
  flex: 1,
  backgroundColor: colors.primary,
  padding: 14,
  borderRadius: 14,
  alignItems: 'center',
} as const;

const dangerActionText = {
  color: 'white',
  fontWeight: 'bold',
} as const;

const outlineAction = {
  flex: 1,
  backgroundColor: colors.card,
  padding: 14,
  borderRadius: 14,
  alignItems: 'center',
  borderWidth: 1,
  borderColor: colors.primary,
} as const;

const outlineActionText = {
  color: colors.primary,
  fontWeight: 'bold',
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

const horarioBlocked = {
  backgroundColor: colors.danger,
  borderColor: colors.primary,
} as const;

const horarioDisabled = {
  backgroundColor: colors.disabled,
  opacity: 0.65,
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
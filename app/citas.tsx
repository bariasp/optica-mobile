import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  Alert,
  ScrollView,
  TouchableOpacity,
} from 'react-native';

import { useRouter, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';

import { api } from '../services/api';
import { colors, shadows } from '../constants/theme';

type Usuario = {
  rol: string;
};

type Cita = {
  id: number;
  fechaHora: string;
  estado: string;
  paciente?: {
    nombre: string;
    rut?: string;
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
  const [cargando, setCargando] = useState(true);

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
      setCargando(true);
      const response = await api.get('/citas');
      setCitas(response.data);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar las citas');
    } finally {
      setCargando(false);
    }
  }

  function confirmarCancelacion(id: number) {
    Alert.alert(
      'Cancelar cita',
      '¿Estás seguro de que quieres cancelar esta cita?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Sí, cancelar', style: 'destructive', onPress: () => cancelarCita(id) },
      ],
    );
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

  function formatearFecha(fecha: string) {
    return new Date(fecha).toLocaleDateString();
  }

  function formatearHora(fecha: string) {
    return new Date(fecha).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function estadoStyle(estado: string) {
    if (estado === 'PENDIENTE') return estadoPendiente;
    if (estado === 'CONFIRMADA') return estadoConfirmada;
    if (estado === 'CANCELADA') return estadoCancelada;
    return estadoBase;
  }

  if (!usuario || cargando) {
    return (
      <View style={centerStyle}>
        <Text>Cargando citas...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={heroStyle}
      >
        <Text style={heroTitle}>Mis citas</Text>
        <Text style={heroSubtitle}>
          Revisa tus horas agendadas y su estado
        </Text>
      </LinearGradient>

      <View style={contentStyle}>
        {citas.length === 0 ? (
          <View style={emptyCard}>
            <Text style={emptyTitle}>No hay citas registradas</Text>
            <Text style={emptyText}>
              Cuando exista una hora agendada, aparecerá en esta sección.
            </Text>
          </View>
        ) : (
          citas.map((cita) => (
            <View key={cita.id} style={cardStyle}>
              <View style={cardHeader}>
                <View>
                  <Text style={dateText}>{formatearFecha(cita.fechaHora)}</Text>
                  <Text style={hourText}>{formatearHora(cita.fechaHora)}</Text>
                </View>

                <View style={estadoStyle(cita.estado)}>
                  <Text style={estadoText}>{cita.estado}</Text>
                </View>
              </View>

              <View style={divider} />

              <Text style={label}>Paciente</Text>
              <Text style={value}>{cita.paciente?.nombre || 'Sin paciente'}</Text>

              {cita.paciente?.rut && (
                <>
                  <Text style={label}>RUT</Text>
                  <Text style={value}>{cita.paciente.rut}</Text>
                </>
              )}

              <Text style={label}>Profesional</Text>
              <Text style={value}>
                {cita.profesional?.nombre || 'Sin profesional'}
              </Text>

              <Text style={label}>Especialidad</Text>
              <Text style={value}>
                {cita.profesional?.especialidad || 'Sin especialidad'}
              </Text>

              {cita.estado === 'PENDIENTE' && (
                <TouchableOpacity
                  onPress={() => confirmarCancelacion(cita.id)}
                  style={cancelButton}
                >
                  <Text style={cancelButtonText}>Cancelar cita</Text>
                </TouchableOpacity>
              )}
            </View>
          ))
        )}

        <TouchableOpacity
          onPress={() => router.back()}
          style={backButton}
        >
          <Text style={backButtonText}>Volver</Text>
        </TouchableOpacity>
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

const cardStyle = {
  backgroundColor: colors.card,
  padding: 16,
  borderRadius: 18,
  marginBottom: 14,
  borderWidth: 1,
  borderColor: colors.border,
  ...shadows.card,
} as const;

const cardHeader = {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
} as const;

const dateText = {
  color: colors.muted,
  fontSize: 13,
} as const;

const hourText = {
  color: colors.text,
  fontSize: 24,
  fontWeight: 'bold',
  marginTop: 2,
} as const;

const divider = {
  height: 1,
  backgroundColor: colors.border,
  marginVertical: 12,
} as const;

const label = {
  color: colors.muted,
  fontSize: 12,
  marginTop: 6,
} as const;

const value = {
  color: colors.text,
  fontSize: 15,
  fontWeight: '600',
} as const;

const estadoBase = {
  paddingVertical: 6,
  paddingHorizontal: 10,
  borderRadius: 999,
  backgroundColor: colors.disabled,
} as const;

const estadoPendiente = {
  ...estadoBase,
  backgroundColor: colors.warning,
} as const;

const estadoConfirmada = {
  ...estadoBase,
  backgroundColor: colors.success,
} as const;

const estadoCancelada = {
  ...estadoBase,
  backgroundColor: colors.disabled,
} as const;

const estadoText = {
  fontSize: 11,
  fontWeight: 'bold',
  color: colors.text,
} as const;

const cancelButton = {
  marginTop: 16,
  backgroundColor: colors.danger,
  padding: 13,
  borderRadius: 14,
  alignItems: 'center',
} as const;

const cancelButtonText = {
  color: colors.primaryDark,
  fontWeight: 'bold',
} as const;

const backButton = {
  backgroundColor: colors.card,
  padding: 15,
  borderRadius: 14,
  alignItems: 'center',
  marginTop: 10,
  marginBottom: 30,
  borderWidth: 1,
  borderColor: colors.border,
} as const;

const backButtonText = {
  color: colors.primary,
  fontWeight: 'bold',
} as const;

const emptyCard = {
  backgroundColor: colors.card,
  padding: 20,
  borderRadius: 18,
  borderWidth: 1,
  borderColor: colors.border,
  ...shadows.card,
} as const;

const emptyTitle = {
  fontSize: 18,
  fontWeight: 'bold',
  color: colors.text,
} as const;

const emptyText = {
  color: colors.muted,
  marginTop: 6,
} as const;
import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';

import { api } from '../services/api';
import { colors, shadows } from '../constants/theme';

type Usuario = {
  rol: string;
};

type Paciente = {
  id: number;
  nombre: string;
  rut: string;
  fechaNacimiento: string;
  telefono: string | null;
  email: string | null;
};

type Cita = {
  id: number;
  fechaHora: string;
  estado: 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA';
  paciente?: Paciente;
  profesional?: {
    id: number;
    nombre: string;
    rut: string;
    especialidad: string;
  };
};

type Vista = 'resumen' | 'pacientes' | 'citas';
type OrdenPacientes = 'nombre' | 'edad' | 'rut';
type FiltroEstado = 'TODAS' | 'PENDIENTE' | 'CONFIRMADA' | 'CANCELADA';

export default function PanelInternoScreen() {
  const hoy = new Date();

  const fechaHoy =
    `${hoy.getFullYear()}-` +
    `${String(hoy.getMonth() + 1).padStart(2, '0')}-` +
    `${String(hoy.getDate()).padStart(2, '0')}`;

  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [citas, setCitas] = useState<Cita[]>([]);
  const [cargando, setCargando] = useState(true);

  const [vista, setVista] = useState<Vista>('resumen');
  const [busqueda, setBusqueda] = useState('');
  const [fechaFiltro, setFechaFiltro] = useState(fechaHoy);
  const [estadoFiltro, setEstadoFiltro] = useState<FiltroEstado>('TODAS');
  const [ordenPacientes, setOrdenPacientes] =
    useState<OrdenPacientes>('nombre');

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    try {
      setCargando(true);

      const usuarioRes = await api.get('/auth/me');

      if (
        usuarioRes.data.rol !== 'ADMIN' &&
        usuarioRes.data.rol !== 'PROFESIONAL'
      ) {
        Alert.alert(
          'Acceso denegado',
          'Solo personal interno puede acceder aquí',
        );
        return;
      }

      setUsuario(usuarioRes.data);

      const [pacientesRes, citasRes] = await Promise.all([
        api.get('/users/pacientes'),
        api.get('/citas'),
      ]);

      setPacientes(pacientesRes.data);
      setCitas(citasRes.data);
    } catch {
      Alert.alert('Error', 'No se pudo cargar la información');
    } finally {
      setCargando(false);
    }
  }

  function calcularEdad(fechaNacimiento: string) {
    const nacimiento = new Date(fechaNacimiento);
    const ahora = new Date();

    let edad = ahora.getFullYear() - nacimiento.getFullYear();
    const mes = ahora.getMonth() - nacimiento.getMonth();

    if (
      mes < 0 ||
      (mes === 0 && ahora.getDate() < nacimiento.getDate())
    ) {
      edad--;
    }

    return edad;
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

  function cambiarDia(dias: number) {
    const nuevaFecha = new Date(`${fechaFiltro}T00:00:00`);
    nuevaFecha.setDate(nuevaFecha.getDate() + dias);

    const texto =
      `${nuevaFecha.getFullYear()}-` +
      `${String(nuevaFecha.getMonth() + 1).padStart(2, '0')}-` +
      `${String(nuevaFecha.getDate()).padStart(2, '0')}`;

    setFechaFiltro(texto);
  }

  const pacientesFiltrados = useMemo(() => {
    const texto = busqueda.toLowerCase().trim();

    const filtrados = pacientes.filter((paciente) => {
      return (
        paciente.nombre.toLowerCase().includes(texto) ||
        paciente.rut.toLowerCase().includes(texto) ||
        paciente.email?.toLowerCase().includes(texto)
      );
    });

    return filtrados.sort((a, b) => {
      if (ordenPacientes === 'nombre') {
        return a.nombre.localeCompare(b.nombre);
      }

      if (ordenPacientes === 'rut') {
        return a.rut.localeCompare(b.rut);
      }

      return (
        calcularEdad(b.fechaNacimiento) -
        calcularEdad(a.fechaNacimiento)
      );
    });
  }, [pacientes, busqueda, ordenPacientes]);

  const citasFiltradas = useMemo(() => {
    return citas
      .filter((cita) => {
        const fechaCita = cita.fechaHora.substring(0, 10);
        const coincideFecha = fechaCita === fechaFiltro;

        const coincideEstado =
          estadoFiltro === 'TODAS' || cita.estado === estadoFiltro;

        const texto = busqueda.toLowerCase().trim();

        const coincideBusqueda =
          !texto ||
          cita.paciente?.nombre.toLowerCase().includes(texto) ||
          cita.paciente?.rut.toLowerCase().includes(texto) ||
          cita.profesional?.nombre.toLowerCase().includes(texto);

        return coincideFecha && coincideEstado && coincideBusqueda;
      })
      .sort(
        (a, b) =>
          new Date(a.fechaHora).getTime() -
          new Date(b.fechaHora).getTime(),
      );
  }, [citas, fechaFiltro, estadoFiltro, busqueda]);

  const resumenDia = useMemo(() => {
    const citasDelDia = citas.filter(
      (cita) => cita.fechaHora.substring(0, 10) === fechaFiltro,
    );

    return {
      total: citasDelDia.length,
      pendientes: citasDelDia.filter((c) => c.estado === 'PENDIENTE')
        .length,
      confirmadas: citasDelDia.filter((c) => c.estado === 'CONFIRMADA')
        .length,
      canceladas: citasDelDia.filter((c) => c.estado === 'CANCELADA')
        .length,
    };
  }, [citas, fechaFiltro]);

  function estadoColor(estado: string) {
    if (estado === 'PENDIENTE') return colors.warning;
    if (estado === 'CONFIRMADA') return colors.success;
    if (estado === 'CANCELADA') return colors.disabled;
    return colors.card;
  }

  if (!usuario || cargando) {
    return (
      <View style={centerStyle}>
        <Text>Cargando información...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={heroStyle}
      >
        <Text style={heroTitle}>Panel interno</Text>
        <Text style={heroSubtitle}>
          Pacientes, citas y resumen administrativo
        </Text>
      </LinearGradient>

      <View style={contentStyle}>
        <View style={tabsContainer}>
          {(['resumen', 'pacientes', 'citas'] as Vista[]).map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => setVista(item)}
              style={[
                tabButton,
                vista === item && tabButtonActive,
              ]}
            >
              <Text
                style={[
                  tabText,
                  vista === item && tabTextActive,
                ]}
              >
                {item.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          placeholder="Buscar por nombre, RUT o profesional"
          value={busqueda}
          onChangeText={setBusqueda}
          autoCapitalize="none"
          placeholderTextColor={colors.muted}
          style={inputStyle}
        />

        {(vista === 'resumen' || vista === 'citas') && (
          <>
            <View style={dateCard}>
              <Text style={dateLabel}>Fecha seleccionada</Text>
              <Text style={dateText}>{fechaFiltro}</Text>

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

            <View style={filtersWrap}>
              {(['TODAS', 'PENDIENTE', 'CONFIRMADA', 'CANCELADA'] as FiltroEstado[]).map(
                (estado) => (
                  <TouchableOpacity
                    key={estado}
                    onPress={() => setEstadoFiltro(estado)}
                    style={[
                      filterChip,
                      estadoFiltro === estado && filterChipActive,
                    ]}
                  >
                    <Text
                      style={[
                        filterChipText,
                        estadoFiltro === estado && filterChipTextActive,
                      ]}
                    >
                      {estado}
                    </Text>
                  </TouchableOpacity>
                ),
              )}
            </View>
          </>
        )}

        {vista === 'resumen' && (
          <>
            <Text style={sectionTitle}>Resumen del día</Text>

            <View style={statsGrid}>
              <View style={statCard}>
                <Text style={statNumber}>{resumenDia.total}</Text>
                <Text style={statLabel}>Total</Text>
              </View>

              <View style={statCard}>
                <Text style={statNumber}>{resumenDia.pendientes}</Text>
                <Text style={statLabel}>Pendientes</Text>
              </View>

              <View style={statCard}>
                <Text style={statNumber}>{resumenDia.confirmadas}</Text>
                <Text style={statLabel}>Confirmadas</Text>
              </View>

              <View style={statCard}>
                <Text style={statNumber}>{resumenDia.canceladas}</Text>
                <Text style={statLabel}>Canceladas</Text>
              </View>
            </View>

            <View style={cardStyle}>
              <Text style={cardTitle}>Pacientes inscritos</Text>
              <Text style={bigNumber}>{pacientes.length}</Text>
              <Text style={mutedText}>Registros administrativos activos</Text>
            </View>

            <Text style={sectionTitle}>Citas del día</Text>

            {citasFiltradas.length === 0 ? (
              <View style={cardStyle}>
                <Text style={cardTitle}>Sin citas</Text>
                <Text style={mutedText}>No hay citas para esta fecha.</Text>
              </View>
            ) : (
              citasFiltradas.map((cita) => (
                <View
                  key={cita.id}
                  style={[
                    cardStyle,
                    { backgroundColor: estadoColor(cita.estado) },
                  ]}
                >
                  <Text style={cardTitle}>
                    {formatearHora(cita.fechaHora)} - {cita.paciente?.nombre}
                  </Text>
                  <Text style={mutedText}>{cita.profesional?.nombre}</Text>
                  <Text style={stateText}>{cita.estado}</Text>
                </View>
              ))
            )}
          </>
        )}

        {vista === 'pacientes' && (
          <>
            <Text style={sectionTitle}>Pacientes inscritos</Text>

            <View style={filtersWrap}>
              {(['nombre', 'edad', 'rut'] as OrdenPacientes[]).map((orden) => (
                <TouchableOpacity
                  key={orden}
                  onPress={() => setOrdenPacientes(orden)}
                  style={[
                    filterChip,
                    ordenPacientes === orden && filterChipActive,
                  ]}
                >
                  <Text
                    style={[
                      filterChipText,
                      ordenPacientes === orden && filterChipTextActive,
                    ]}
                  >
                    Orden: {orden}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={resultText}>
              Resultados: {pacientesFiltrados.length}
            </Text>

            {pacientesFiltrados.map((paciente) => (
              <View key={paciente.id} style={cardStyle}>
                <Text style={cardTitle}>{paciente.nombre}</Text>
                <Text style={mutedText}>RUT: {paciente.rut}</Text>
                <Text style={valueText}>
                  Edad: {calcularEdad(paciente.fechaNacimiento)} años
                </Text>
                <Text style={valueText}>
                  Nacimiento: {formatearFecha(paciente.fechaNacimiento)}
                </Text>
                <Text style={valueText}>
                  Email: {paciente.email || 'No registrado'}
                </Text>
                <Text style={valueText}>
                  Teléfono: {paciente.telefono || 'No registrado'}
                </Text>
              </View>
            ))}
          </>
        )}

        {vista === 'citas' && (
          <>
            <Text style={sectionTitle}>Citas del día</Text>
            <Text style={resultText}>
              Resultados: {citasFiltradas.length}
            </Text>

            {citasFiltradas.length === 0 ? (
              <View style={cardStyle}>
                <Text style={cardTitle}>Sin resultados</Text>
                <Text style={mutedText}>
                  No hay citas con los filtros seleccionados.
                </Text>
              </View>
            ) : (
              citasFiltradas.map((cita) => (
                <View
                  key={cita.id}
                  style={[
                    cardStyle,
                    { backgroundColor: estadoColor(cita.estado) },
                  ]}
                >
                  <Text style={cardTitle}>
                    {formatearHora(cita.fechaHora)} - {cita.estado}
                  </Text>

                  <Text style={valueText}>
                    Paciente: {cita.paciente?.nombre}
                  </Text>
                  <Text style={valueText}>RUT: {cita.paciente?.rut}</Text>
                  <Text style={valueText}>
                    Edad:{' '}
                    {cita.paciente
                      ? calcularEdad(cita.paciente.fechaNacimiento)
                      : 'Sin dato'}
                  </Text>

                  <Text style={valueText}>
                    Profesional: {cita.profesional?.nombre}
                  </Text>
                  <Text style={valueText}>
                    Especialidad: {cita.profesional?.especialidad}
                  </Text>
                </View>
              ))
            )}
          </>
        )}

        <View style={{ height: 30 }} />
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

const tabsContainer = {
  flexDirection: 'row',
  gap: 8,
  marginBottom: 14,
} as const;

const tabButton = {
  flex: 1,
  backgroundColor: colors.card,
  padding: 12,
  borderRadius: 14,
  alignItems: 'center',
  borderWidth: 1,
  borderColor: colors.border,
} as const;

const tabButtonActive = {
  backgroundColor: colors.primary,
  borderColor: colors.primary,
} as const;

const tabText = {
  color: colors.muted,
  fontWeight: 'bold',
  fontSize: 11,
} as const;

const tabTextActive = {
  color: 'white',
} as const;

const inputStyle = {
  backgroundColor: colors.card,
  borderWidth: 1,
  borderColor: colors.border,
  padding: 14,
  borderRadius: 14,
  marginBottom: 14,
} as const;

const dateCard = {
  backgroundColor: colors.card,
  padding: 16,
  borderRadius: 18,
  borderWidth: 1,
  borderColor: colors.border,
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

const filtersWrap = {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 8,
  marginTop: 14,
  marginBottom: 4,
} as const;

const filterChip = {
  paddingVertical: 9,
  paddingHorizontal: 12,
  borderRadius: 999,
  borderWidth: 1,
  borderColor: colors.border,
  backgroundColor: colors.card,
} as const;

const filterChipActive = {
  backgroundColor: colors.primary,
  borderColor: colors.primary,
} as const;

const filterChipText = {
  color: colors.muted,
  fontWeight: 'bold',
  fontSize: 12,
} as const;

const filterChipTextActive = {
  color: 'white',
} as const;

const sectionTitle = {
  fontSize: 18,
  fontWeight: 'bold',
  color: colors.text,
  marginTop: 20,
  marginBottom: 10,
} as const;

const statsGrid = {
  flexDirection: 'row',
  flexWrap: 'wrap',
  gap: 10,
} as const;

const statCard = {
  width: '48%',
  backgroundColor: colors.card,
  padding: 16,
  borderRadius: 18,
  borderWidth: 1,
  borderColor: colors.border,
  ...shadows.card,
} as const;

const statNumber = {
  fontSize: 26,
  fontWeight: 'bold',
  color: colors.primary,
} as const;

const statLabel = {
  color: colors.muted,
  marginTop: 4,
} as const;

const cardStyle = {
  backgroundColor: colors.card,
  padding: 16,
  borderRadius: 18,
  borderWidth: 1,
  borderColor: colors.border,
  marginBottom: 12,
  ...shadows.card,
} as const;

const cardTitle = {
  fontSize: 17,
  fontWeight: 'bold',
  color: colors.text,
} as const;

const bigNumber = {
  fontSize: 34,
  fontWeight: 'bold',
  color: colors.primary,
  marginTop: 6,
} as const;

const mutedText = {
  color: colors.muted,
  marginTop: 4,
} as const;

const valueText = {
  color: colors.text,
  marginTop: 5,
} as const;

const stateText = {
  marginTop: 8,
  fontWeight: 'bold',
  color: colors.text,
} as const;

const resultText = {
  color: colors.muted,
  marginBottom: 10,
} as const;

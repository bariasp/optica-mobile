import { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  Button,
} from 'react-native';

import { api } from '../services/api';

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
    } catch (error) {
      Alert.alert('Error', 'No se pudo cargar la información');
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

  function colorEstado(estado: string) {
    if (estado === 'PENDIENTE') return '#fff7cc';
    if (estado === 'CONFIRMADA') return '#dcfce7';
    if (estado === 'CANCELADA') return '#e5e5e5';
    return 'white';
  }

  if (!usuario) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Cargando información...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 26, fontWeight: 'bold' }}>
        Panel interno
      </Text>

      <Text style={{ marginTop: 4, color: '#555' }}>
        Información administrativa de pacientes y citas
      </Text>

      <View style={{ flexDirection: 'row', gap: 8, marginTop: 20 }}>
        <Button title="Resumen" onPress={() => setVista('resumen')} />
        <Button title="Pacientes" onPress={() => setVista('pacientes')} />
        <Button title="Citas" onPress={() => setVista('citas')} />
      </View>

      <TextInput
        placeholder="Buscar por nombre, RUT o profesional"
        value={busqueda}
        onChangeText={setBusqueda}
        autoCapitalize="none"
        style={{
          marginTop: 20,
          borderWidth: 1,
          borderRadius: 8,
          padding: 12,
          backgroundColor: 'white',
        }}
      />

      {(vista === 'resumen' || vista === 'citas') && (
        <>
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 15,
            }}
          >
            <Button title="←" onPress={() => cambiarDia(-1)} />
            <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
              {fechaFiltro}
            </Text>
            <Button title="→" onPress={() => cambiarDia(1)} />
          </View>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {(['TODAS', 'PENDIENTE', 'CONFIRMADA', 'CANCELADA'] as FiltroEstado[]).map(
              (estado) => (
                <TouchableOpacity
                  key={estado}
                  onPress={() => setEstadoFiltro(estado)}
                  style={{
                    padding: 10,
                    borderRadius: 8,
                    borderWidth: 1,
                    backgroundColor:
                      estadoFiltro === estado ? '#dbeafe' : 'white',
                  }}
                >
                  <Text>{estado}</Text>
                </TouchableOpacity>
              ),
            )}
          </View>
        </>
      )}

      {vista === 'resumen' && (
        <View style={{ marginTop: 20, gap: 10 }}>
          <View style={cardStyle}>
            <Text style={titleStyle}>Resumen del día</Text>
            <Text>Total citas: {resumenDia.total}</Text>
            <Text>Pendientes: {resumenDia.pendientes}</Text>
            <Text>Confirmadas: {resumenDia.confirmadas}</Text>
            <Text>Canceladas: {resumenDia.canceladas}</Text>
          </View>

          <View style={cardStyle}>
            <Text style={titleStyle}>Pacientes inscritos</Text>
            <Text>Total pacientes: {pacientes.length}</Text>
          </View>

          <View style={cardStyle}>
            <Text style={titleStyle}>Próximas citas del día</Text>

            {citasFiltradas.length === 0 ? (
              <Text>No hay citas para esta fecha.</Text>
            ) : (
              citasFiltradas.map((cita) => (
                <View
                  key={cita.id}
                  style={{
                    marginTop: 10,
                    padding: 10,
                    borderRadius: 8,
                    backgroundColor: colorEstado(cita.estado),
                  }}
                >
                  <Text style={{ fontWeight: 'bold' }}>
                    {formatearHora(cita.fechaHora)} -{' '}
                    {cita.paciente?.nombre}
                  </Text>
                  <Text>{cita.profesional?.nombre}</Text>
                  <Text>{cita.estado}</Text>
                </View>
              ))
            )}
          </View>
        </View>
      )}

      {vista === 'pacientes' && (
        <View style={{ marginTop: 20 }}>
          <Text style={titleStyle}>Pacientes inscritos</Text>

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
            {(['nombre', 'edad', 'rut'] as OrdenPacientes[]).map((orden) => (
              <TouchableOpacity
                key={orden}
                onPress={() => setOrdenPacientes(orden)}
                style={{
                  padding: 10,
                  borderRadius: 8,
                  borderWidth: 1,
                  backgroundColor:
                    ordenPacientes === orden ? '#dbeafe' : 'white',
                }}
              >
                <Text>Orden: {orden}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={{ marginTop: 12 }}>
            Resultados: {pacientesFiltrados.length}
          </Text>

          {pacientesFiltrados.map((paciente) => (
            <View key={paciente.id} style={cardStyle}>
              <Text style={titleStyle}>{paciente.nombre}</Text>
              <Text>RUT: {paciente.rut}</Text>
              <Text>Edad: {calcularEdad(paciente.fechaNacimiento)} años</Text>
              <Text>
                Nacimiento: {formatearFecha(paciente.fechaNacimiento)}
              </Text>
              <Text>Email: {paciente.email || 'No registrado'}</Text>
              <Text>Teléfono: {paciente.telefono || 'No registrado'}</Text>
            </View>
          ))}
        </View>
      )}

      {vista === 'citas' && (
        <View style={{ marginTop: 20 }}>
          <Text style={titleStyle}>Citas del día</Text>
          <Text style={{ marginTop: 5 }}>
            Resultados: {citasFiltradas.length}
          </Text>

          {citasFiltradas.length === 0 ? (
            <View style={cardStyle}>
              <Text>No hay citas con estos filtros.</Text>
            </View>
          ) : (
            citasFiltradas.map((cita) => (
              <View
                key={cita.id}
                style={[
                  cardStyle,
                  {
                    backgroundColor: colorEstado(cita.estado),
                  },
                ]}
              >
                <Text style={titleStyle}>
                  {formatearHora(cita.fechaHora)} - {cita.estado}
                </Text>

                <Text>Paciente: {cita.paciente?.nombre}</Text>
                <Text>RUT: {cita.paciente?.rut}</Text>
                <Text>
                  Edad:{' '}
                  {cita.paciente
                    ? calcularEdad(cita.paciente.fechaNacimiento)
                    : 'Sin dato'}
                </Text>

                <Text style={{ marginTop: 8 }}>
                  Profesional: {cita.profesional?.nombre}
                </Text>
                <Text>Especialidad: {cita.profesional?.especialidad}</Text>
              </View>
            ))
          )}
        </View>
      )}

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const cardStyle = {
  marginTop: 12,
  padding: 14,
  borderWidth: 1,
  borderRadius: 10,
  backgroundColor: 'white',
} as const;

const titleStyle = {
  fontSize: 18,
  fontWeight: 'bold',
  marginBottom: 6,
} as const;
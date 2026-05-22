import { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Button,
} from 'react-native';

import { api } from '../services/api';

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
      const response = await api.get(
        `/citas/disponibles?fecha=${fecha}&profesionalId=${profesionalSeleccionado.id}`,
      );

      setHorarios(response.data);
    } catch {
      Alert.alert('Error', 'No se pudieron cargar horarios');
    }
  }

  async function reservarHorario(hora: string) {
    if (!pacienteSeleccionado || !profesionalSeleccionado) return;

    if (esHorarioPasado(hora)) {
      Alert.alert('Error', 'No puedes reservar un horario pasado');
      return;
    }

    try {
      await api.post('/citas', {
        fechaHora: `${fecha}T${hora}:00`,
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

  if (usuario && usuario.rol !== 'ADMIN') {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Acceso restringido</Text>
      </View>
    );
  }

  if (!pacienteSeleccionado) {
    return (
      <View style={{ flex: 1, padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
          Seleccionar paciente
        </Text>

        <ScrollView style={{ marginTop: 20 }}>
          {pacientes.map((paciente) => (
            <TouchableOpacity
              key={paciente.id}
              onPress={() => setPacienteSeleccionado(paciente)}
              style={{
                padding: 15,
                borderWidth: 1,
                borderRadius: 8,
                marginBottom: 10,
                backgroundColor: 'white',
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
                {paciente.nombre}
              </Text>
              <Text>{paciente.rut}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  }

  if (!profesionalSeleccionado) {
    return (
      <View style={{ flex: 1, padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
          Seleccionar profesional
        </Text>

        <Text style={{ marginTop: 10 }}>
          Paciente: {pacienteSeleccionado.nombre}
        </Text>

        <ScrollView style={{ marginTop: 20 }}>
          {profesionales.map((profesional) => (
            <TouchableOpacity
              key={profesional.id}
              onPress={() => setProfesionalSeleccionado(profesional)}
              style={{
                padding: 15,
                borderWidth: 1,
                borderRadius: 8,
                marginBottom: 10,
                backgroundColor: 'white',
              }}
            >
              <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
                {profesional.nombre}
              </Text>
              <Text>{profesional.especialidad}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Button
          title="Cambiar paciente"
          onPress={() => {
            setPacienteSeleccionado(null);
            setProfesionalSeleccionado(null);
            setHorarios([]);
          }}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 20 }}>
      <Text style={{ fontSize: 24, fontWeight: 'bold' }}>
        Reservar hora
      </Text>

      <Text style={{ marginTop: 10 }}>
        Paciente: {pacienteSeleccionado.nombre}
      </Text>

      <Text>
        Profesional: {profesionalSeleccionado.nombre}
      </Text>

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginTop: 20,
        }}
      >
        <Button title="←" onPress={() => cambiarDia(-1)} />

        <Text style={{ fontSize: 18 }}>{fecha}</Text>

        <Button title="→" onPress={() => cambiarDia(1)} />
      </View>

      <ScrollView style={{ marginTop: 20 }}>
        {horarios.length === 0 ? (
          <Text>No hay horarios disponibles.</Text>
        ) : (
          horarios.map((horario) => {
            const pasado = esHorarioPasado(horario.hora);
            const disponibleReal = horario.disponible && !pasado;

            let estadoTexto = 'Disponible';

            if (pasado) {
              estadoTexto = 'Horario pasado';
            } else if (horario.bloqueado) {
              estadoTexto = 'Bloqueado';
            } else if (!horario.disponible) {
              estadoTexto = 'Ocupado';
            }

            return (
              <TouchableOpacity
                key={horario.hora}
                disabled={!disponibleReal}
                onPress={() => reservarHorario(horario.hora)}
                style={{
                  padding: 15,
                  borderWidth: 1,
                  borderRadius: 8,
                  marginBottom: 10,
                  opacity: disponibleReal ? 1 : 0.4,
                  backgroundColor: pasado
                    ? '#dcdcdc'
                    : horario.bloqueado
                    ? '#fecaca'
                    : disponibleReal
                    ? 'white'
                    : '#dcdcdc',
                }}
              >
                <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
                  {horario.hora}
                </Text>

                <Text>{estadoTexto}</Text>
              </TouchableOpacity>
            );
          })
        )}
      </ScrollView>

      <View style={{ gap: 10 }}>
        <Button
          title="Cambiar profesional"
          onPress={() => {
            setProfesionalSeleccionado(null);
            setHorarios([]);
          }}
        />

        <Button
          title="Cambiar paciente"
          onPress={() => {
            setPacienteSeleccionado(null);
            setProfesionalSeleccionado(null);
            setHorarios([]);
          }}
        />
      </View>
    </View>
  );
}
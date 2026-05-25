import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  Image,
} from 'react-native';

import { LinearGradient } from 'expo-linear-gradient';
import * as SecureStore from 'expo-secure-store';
import { useRouter } from 'expo-router';

import { api } from '../services/api';
import { colors, shadows } from '../constants/theme';

type Usuario = {
  nombre: string;
  rol: string;
};

export default function HomeScreen() {
  const router = useRouter();
  const [usuario, setUsuario] = useState<Usuario | null>(null);

  useEffect(() => {
    cargarUsuario();
  }, []);

  async function cargarUsuario() {
    try {
      const token = await SecureStore.getItemAsync('token');

      if (!token) {
        router.replace('/');
        return;
      }

      const res = await api.get('/auth/me');
      setUsuario(res.data);
    } catch {
      Alert.alert('Error', 'Sesión inválida');
      await SecureStore.deleteItemAsync('token');
      router.replace('/');
    }
  }

  async function logout() {
    await SecureStore.deleteItemAsync('token');
    router.replace('/');
  }

  function Card({
    title,
    subtitle,
    onPress,
  }: {
    title: string;
    subtitle: string;
    onPress: () => void;
  }) {
    return (
      <TouchableOpacity onPress={onPress} style={cardStyle}>
        <Text style={cardTitle}>{title}</Text>
        <Text style={cardSubtitle}>{subtitle}</Text>
      </TouchableOpacity>
    );
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
        <Image
          source={require('../assets/zeus-logo-rojo.png')}
          style={logoStyle}
          resizeMode="contain"
        />

        <Text style={welcomeText}>Hola, {usuario.nombre}</Text>

        <View style={roleBadge}>
          <Text style={roleBadgeText}>{usuario.rol}</Text>
        </View>
      </LinearGradient>

      <View style={contentStyle}>
        <Text style={sectionTitle}>Agenda</Text>

        <Card
          title="Ver citas"
          subtitle="Consulta tus horas registradas"
          onPress={() => router.push('/citas')}
        />

        {usuario.rol === 'PACIENTE' && (
          <Card
            title="Reservar hora"
            subtitle="Agenda una nueva atención"
            onPress={() => router.push('/reservar')}
          />
        )}

        {usuario.rol !== 'PACIENTE' && (
          <Card
            title="Gestionar agenda"
            subtitle="Bloquea horarios o días completos"
            onPress={() => router.push('/gestionar-bloqueos')}
          />
        )}

        {usuario.rol === 'ADMIN' && (
          <>
            <Text style={sectionTitle}>Administración</Text>

            <Card
              title="Reservar para paciente"
              subtitle="Agenda horas para pacientes registrados"
              onPress={() => router.push('/reservar-admin')}
            />

            <Card
              title="Crear paciente"
              subtitle="Registra nuevos pacientes"
              onPress={() => router.push('/crear-paciente')}
            />

            <Card
              title="Crear profesional"
              subtitle="Registra personal profesional"
              onPress={() => router.push('/crear-profesional')}
            />
          </>
        )}

        {usuario.rol !== 'PACIENTE' && (
          <>
            <Text style={sectionTitle}>Información</Text>

            <Card
              title="Panel interno"
              subtitle="Revisa pacientes, citas y resumen diario"
              onPress={() => router.push('/panel-interno')}
            />
          </>
        )}

        <TouchableOpacity onPress={logout} style={logoutStyle}>
          <Text style={logoutText}>Cerrar sesión</Text>
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
  alignItems: 'center',
  borderBottomLeftRadius: 34,
  borderBottomRightRadius: 34,
} as const;

const logoStyle = {
  width: 155,
  height: 105,
  borderRadius: 22,
  marginBottom: 8,
} as const;

const welcomeText = {
  color: 'white',
  fontSize: 18,
  fontWeight: 'bold',
  marginTop: 6,
} as const;

const roleBadge = {
  backgroundColor: 'white',
  borderRadius: 999,
  paddingVertical: 6,
  paddingHorizontal: 14,
  marginTop: 12,
} as const;

const roleBadgeText = {
  color: colors.primaryDark,
  fontWeight: 'bold',
  fontSize: 12,
} as const;

const contentStyle = {
  padding: 20,
} as const;

const sectionTitle = {
  fontSize: 18,
  fontWeight: 'bold',
  color: colors.text,
  marginTop: 20,
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
  marginTop: 5,
  color: colors.muted,
  fontSize: 13,
} as const;

const logoutStyle = {
  backgroundColor: colors.danger,
  padding: 16,
  borderRadius: 16,
  alignItems: 'center',
  marginTop: 28,
  marginBottom: 30,
} as const;

const logoutText = {
  color: colors.primaryDark,
  fontWeight: 'bold',
} as const;
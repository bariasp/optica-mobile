import { Stack } from 'expo-router';

import { colors } from '../constants/theme';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.primary,
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Login' }} />
      <Stack.Screen name="registro" options={{ title: 'Crear cuenta' }} />
      <Stack.Screen name="home" options={{ title: 'Inicio' }} />
      <Stack.Screen name="citas" options={{ title: 'Mis citas' }} />
      <Stack.Screen name="reservar" options={{ title: 'Reservar hora' }} />
      <Stack.Screen name="reservar-admin" options={{ title: 'Reservar para paciente' }} />
      <Stack.Screen name="gestionar-bloqueos" options={{ title: 'Gestionar agenda' }} />
      <Stack.Screen name="crear-paciente" options={{ title: 'Crear paciente' }} />
      <Stack.Screen name="crear-profesional" options={{ title: 'Crear profesional' }} />
      <Stack.Screen name="panel-interno" options={{ title: 'Panel interno' }} />
    </Stack>
  );
}
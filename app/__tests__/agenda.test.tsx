import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import MyAgendaScreen from '@/app/(tabs)/agenda';
import { supabase } from '@/lib/supabase';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: { getSession: jest.fn(), getUser: jest.fn() },
  },
}));
// Mock Expo and React Navigation hooks
jest.mock('expo-router', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (cb: () => void) => cb(),
}));
// Mock ThemedText
jest.mock('@/components/themedText', () => {
  const { Text } = require('react-native');
  return {
    ThemedText: ({ children, ...props }: any) => (
      <Text {...props}>{children}</Text>
    ),
  };
});
jest.mock('@/components/ui/icon-symbol', () => ({ IconSymbol: () => null }));
// Mock PanelDetail
jest.mock('@/app/panelDetails', () => {
  const { View, Text, TouchableOpacity } = require('react-native');
  return {
    __esModule: true,
    default: ({ panel, onBack }: any) => (
      <View>
        <Text>{panel.title}</Text>
        <TouchableOpacity onPress={onBack}>
          <Text>← Back</Text>
        </TouchableOpacity>
      </View>
    ),
  };
});

// Sample authenticated user
const mockUser = { id: 'user-abc' };

// Two sample agenda rows
const mockAgendaResponse = [
  {
    id: 1,
    panel_id: 1,
    user_id: mockUser.id,
    created_at: '',
    conference_panels: {
      id: 1,
      title: 'Opening Keynote',
      location: 'Main Hall',
      speaker: 'Alice Smith',
      date: 'Day 1',
      session: 'Monday 8:00–9:00 AM',
      tag: 'Keynote',
      abstract: null,
      materials_link: null,
      materials_title: null,
    },
  },
  {
    id: 2,
    panel_id: 2,
    user_id: mockUser.id,
    created_at: '',
    conference_panels: {
      id: 2,
      title: 'Panel Discussion',
      location: 'Room B',
      speaker: 'Bob Jones',
      date: 'Day 1',
      session: 'Monday 10:00–11:00 AM',
      tag: 'Panel',
      abstract: null,
      materials_link: null,
      materials_title: null,
    },
  },
];

// Builds Supabase query mock that resolves to { data, error }
const makeChain = (data: any, error: any = null) => {
  const chain: any = {};
  ['select', 'eq', 'order', 'delete'].forEach((m) => {
    chain[m] = jest.fn(() => chain);
  });
  chain.then = (resolve: any) => resolve({ data, error });
  return chain;
};

// Reset mocks and re-apply auth defaults before each test
beforeEach(() => {
  jest.clearAllMocks();
  (supabase.auth.getSession as jest.Mock).mockResolvedValue({
    data: { session: { user: mockUser } },
    error: null,
  });
  (supabase.auth.getUser as jest.Mock).mockResolvedValue({
    data: { user: mockUser },
    error: null,
  });
});

// Checks that both panel titles appear after Supabase fetch
test('renders event cards after fetching agenda', async () => {
  (supabase.from as jest.Mock).mockReturnValue(makeChain(mockAgendaResponse));
  const { getByText } = render(<MyAgendaScreen />);
  await waitFor(() => expect(getByText('Opening Keynote')).toBeTruthy(), {
    timeout: 10000,
  });
  expect(getByText('Panel Discussion')).toBeTruthy();
});

// Checks that the empty message and Browse Panels button appear when there are no saved panels
test('shows empty state with Browse Panels button when agenda is empty', async () => {
  (supabase.from as jest.Mock).mockReturnValue(makeChain([]));
  const { getByText } = render(<MyAgendaScreen />);
  await waitFor(
    () =>
      expect(
        getByText("You haven't added any panels to your agenda yet."),
      ).toBeTruthy(),
    { timeout: 10000 },
  );
  expect(getByText('Browse Panels')).toBeTruthy();
});

// Checks that tapping a panel card switches view to PanelDetail
test('opens PanelDetail when an event card is tapped', async () => {
  (supabase.from as jest.Mock).mockReturnValue(makeChain(mockAgendaResponse));
  const { getByText } = render(<MyAgendaScreen />);
  await waitFor(() => expect(getByText('Opening Keynote')).toBeTruthy(), {
    timeout: 10000,
  });
  fireEvent.press(getByText('Opening Keynote'));
  await waitFor(() => expect(getByText('← Back')).toBeTruthy());
});

// Checks that pressing back in PanelDetail returns to the agenda list
test('returns to agenda list when Back is pressed in PanelDetail', async () => {
  (supabase.from as jest.Mock).mockReturnValue(makeChain(mockAgendaResponse));
  const { getByText } = render(<MyAgendaScreen />);
  await waitFor(() => expect(getByText('Opening Keynote')).toBeTruthy(), {
    timeout: 10000,
  });
  fireEvent.press(getByText('Opening Keynote'));
  await waitFor(() => getByText('← Back'));
  fireEvent.press(getByText('← Back'));
  await waitFor(() => expect(getByText('Panel Discussion')).toBeTruthy());
});

// Checks that an error alert is shown when getUser returns no authenticated user
test('shows error alert when user is not logged in', async () => {
  const alertSpy = jest.spyOn(require('react-native').Alert, 'alert');
  (supabase.auth.getUser as jest.Mock).mockResolvedValue({
    data: { user: null },
    error: null,
  });
  render(<MyAgendaScreen />);
  await waitFor(
    () =>
      expect(alertSpy).toHaveBeenCalledWith(
        'Error',
        'Please log in to view your agenda',
      ),
    { timeout: 10000 },
  );
});

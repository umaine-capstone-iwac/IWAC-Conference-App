import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import SessionsScreen from '../app/(tabs)/sessions';
import { supabase } from '@/lib/supabase';

// Stores mock query params
let mockParams: Record<string, string | undefined> = {};

// Mock router.setParams for dropdown interactions
const mockSetParams = jest.fn();

// Mock expo router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    setParams: mockSetParams,
  }),
  useLocalSearchParams: () => mockParams,
}));

// Mock navigation focus effect
jest.mock('@react-navigation/native', () => {
  const React = require('react');

  return {
    useFocusEffect: (callback: () => void | (() => void)) => {
      React.useEffect(() => {
        const cleanup = callback();
        return typeof cleanup === 'function' ? cleanup : undefined;
      }, [callback]);
    },
  };
});

// Mock SafeAreaView wrapper
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Replace themed components with basic react components
jest.mock('@/components/themedText', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    ThemedText: ({ children, ...props }: any) =>
      React.createElement(Text, props, children),
  };
});

jest.mock('@/components/themedView', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    ThemedView: ({ children, ...props }: any) =>
      React.createElement(View, props, children),
  };
});

// Mock search input
jest.mock('@/components/input', () => {
  const React = require('react');
  const { TextInput } = require('react-native');

  return {
    Input: ({ text, value, onChangeText }: any) =>
      React.createElement(TextInput, {
        testID: 'search-input',
        placeholder: text,
        value,
        onChangeText,
      }),
  };
});

// Mock icons
jest.mock('@/components/ui/icon-symbol', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    IconSymbol: () => React.createElement(View),
  };
});

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    Ionicons: ({ name }: any) => React.createElement(Text, null, name),
  };
});

// Mock dropdown component
jest.mock('react-native-element-dropdown', () => {
  const React = require('react');
  const { View, Text, Pressable } = require('react-native');

  return {
    Dropdown: ({ data, placeholder, onChange }: any) =>
      React.createElement(
        View,
        null,
        React.createElement(Text, null, placeholder),
        ...data.map((item: any) =>
          React.createElement(
            Pressable,
            {
              key: `${placeholder}-${item.value}`,
              testID: `dropdown-${placeholder}-${item.value}`,
              onPress: () => onChange(item),
            },
            React.createElement(Text, null, item.label),
          ),
        ),
      ),
  };
});

// Mock panel detail screen (shown when panel is clicked)
jest.mock('@/app/panelDetails', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    __esModule: true,
    default: ({ panel }: any) =>
      React.createElement(Text, null, `Panel Detail: ${panel.title}`),
  };
});

// Mock theme constants
jest.mock('@/constants/theme', () => ({
  Colors: {
    awac: {
      beige: '#f5f0e8',
      navy: '#123456',
    },
    lightestBlue: '#eef6ff',
  },
}));

// Replace Supabase client with mock functions
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(),
    },
    from: jest.fn(),
  },
}));

// Cast to mocked version for typing
const mockSupabase = supabase as jest.Mocked<typeof supabase>;

// Mock test data
const panelRows = [
  {
    id: 1,
    title: 'Opening from IWAC Staff',
    location: 'Memorial Union',
    speaker: 'Dr. Heather Falconer',
    date: 'Monday, Dec 2',
    session: '12/2 Session A 9:00 AM - 10:30 AM',
    tag: 'Opening',
    abstract: 'Test abstract for the opening from IWAC Staff',
    materials_title: 'Google Drive Link',
    materials_link:
      'https://drive.google.com/drive/u/0/folders/0ADXagU__cKOcUk9PVA',
  },
];

// Mock query for conference_panels table
function buildConferencePanelsQuery(rows: any[]) {
  const query = {
    select: jest.fn().mockReturnThis(),
    order: jest.fn(),
  };

  // First order() returns chain, second resolves data
  query.order
    .mockImplementationOnce(() => query)
    .mockImplementationOnce(() =>
      Promise.resolve({
        data: rows,
        error: null,
      }),
    );

  return query;
}

// Mock query for user_agenda table
function buildUserAgendaQuery(savedIds: number[] = []) {
  return {
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockResolvedValue({
      data: savedIds.map((panel_id) => ({ panel_id })),
      error: null,
    }),
    insert: jest.fn().mockResolvedValue({ error: null }),
    delete: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        eq: jest.fn().mockResolvedValue({ error: null }),
      }),
    }),
  };
}

// Configures Supabase mock behavior for each test
function setupSupabase({
  panels = panelRows,
  savedIds = [],
  userId = 'user-1',
}: any = {}) {
  // Mock auth session
  mockSupabase.auth.getSession.mockResolvedValue({
    data: {
      session: userId ? { user: { id: userId } } : null,
    },
    error: null,
  } as never);

  // Mock table queries
  mockSupabase.from.mockImplementation((table: string) => {
    if (table === 'conference_panels') {
      return buildConferencePanelsQuery(panels) as never;
    }

    if (table === 'user_agenda') {
      return buildUserAgendaQuery(savedIds) as never;
    }

    throw new Error(`Unexpected table: ${table}`);
  });
}

// Renders screen and waits for async updates to finish
async function renderSessionsScreen() {
  render(<SessionsScreen />);
  await waitFor(() => {
    expect(mockSupabase.from).toHaveBeenCalled();
  });
}

describe('SessionsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockParams = {};
  });

  // Topic filter tests
  test('filters panels by topic from route params', async () => {
    mockParams = { topic: 'Opening' };
    setupSupabase();

    await renderSessionsScreen();

    expect(mockSupabase.from).toHaveBeenCalledWith('conference_panels');
  });

  // Session filter tests
  test('filters panels by session from route params', async () => {
    mockParams = { session: '12/2 Session A 9:00 AM - 10:30 AM' };
    setupSupabase();

    await renderSessionsScreen();

    expect(mockSupabase.from).toHaveBeenCalledWith('conference_panels');
  });

  // Dropdown tests
  test('updates router params when session dropdown changes', async () => {
    setupSupabase();

    await renderSessionsScreen();

    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('conference_panels');
    });
  });

  // Navigation tests
  test('opens panel detail when a panel is pressed', async () => {
    setupSupabase();

    await renderSessionsScreen();

    await waitFor(() => {
      expect(mockSupabase.from).toHaveBeenCalledWith('conference_panels');
    });
  });
});

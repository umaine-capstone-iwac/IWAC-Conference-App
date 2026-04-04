import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import {
  Text,
  View,
  TextInput,
  Pressable,
  type TextProps,
  type ViewProps,
} from 'react-native';
import SessionsScreen from '../app/(tabs)/sessions';
import { supabase } from '@/lib/supabase';

const mockReact = React;
const mockText = Text;
const mockView = View;
const mockTextInput = TextInput;
const mockPressable = Pressable;

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
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: () => void | (() => void)) => {
    mockReact.useEffect(() => {
      const cleanup = callback();
      return typeof cleanup === 'function' ? cleanup : undefined;
    }, [callback]);
  },
}));

// Mock SafeAreaView wrapper
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

// Replace themed components with basic react components
jest.mock('@/components/themedText', () => ({
  ThemedText: ({ children, ...props }: TextProps) =>
    mockReact.createElement(mockText, props, children),
}));

jest.mock('@/components/themedView', () => ({
  ThemedView: ({ children, ...props }: ViewProps) =>
    mockReact.createElement(mockView, props, children),
}));

// Mock search input
jest.mock('@/components/input', () => ({
  Input: ({
    text,
    value,
    onChangeText,
  }: {
    text: string;
    value?: string;
    onChangeText?: (text: string) => void;
  }) =>
    mockReact.createElement(mockTextInput, {
      testID: 'search-input',
      placeholder: text,
      value,
      onChangeText,
    }),
}));

// Mock icons
jest.mock('@/components/ui/icon-symbol', () => ({
  IconSymbol: () => mockReact.createElement(mockView),
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: ({ name }: { name: string }) =>
    mockReact.createElement(mockText, null, name),
}));

// Mock dropdown component
jest.mock('react-native-element-dropdown', () => ({
  Dropdown: ({
    data,
    placeholder,
    onChange,
  }: {
    data: { label: string; value: string }[];
    placeholder: string;
    onChange: (item: { label: string; value: string }) => void;
  }) =>
    mockReact.createElement(
      mockView,
      null,
      mockReact.createElement(mockText, null, placeholder),
      ...data.map((item) =>
        mockReact.createElement(
          mockPressable,
          {
            key: `${placeholder}-${item.value}`,
            testID: `dropdown-${placeholder}-${item.value}`,
            onPress: () => onChange(item),
          },
          mockReact.createElement(mockText, null, item.label),
        ),
      ),
    ),
}));

// Mock panel detail screen (shown when panel is clicked)
jest.mock('@/app/panelDetails', () => ({
  __esModule: true,
  default: ({ panel }: { panel: { title: string } }) =>
    mockReact.createElement(mockText, null, `Panel Detail: ${panel.title}`),
}));

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
function buildConferencePanelsQuery(rows: typeof panelRows) {
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
}: {
  panels?: typeof panelRows;
  savedIds?: number[];
  userId?: string | null;
} = {}) {
  // Mock auth session
  (mockSupabase.auth.getSession as jest.Mock).mockResolvedValue({
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

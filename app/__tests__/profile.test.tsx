import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import ProfileScreen from '@/app/(tabs)/profile';
import { supabase } from '@/lib/supabase';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: { getSession: jest.fn(), getUser: jest.fn() },
  },
}));

// Mock Expo and React Navigation hooks
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({}),
  router: { push: jest.fn(), replace: jest.fn() },
}));

jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (callback: () => void | (() => void)) => {
    // Call the callback immediately in tests
    const cb = callback as () => void | (() => void);
    cb();
  },
}));

// Mock ThemedText and ThemedView
jest.mock('@/components/themedText', () => {
  const { Text } = jest.requireActual('react-native');
  return {
    ThemedText: ({ children, ...props }: Record<string, unknown>) => (
      <Text {...props}>{children}</Text>
    ),
  };
});

jest.mock('@/components/themedView', () => {
  const { View } = jest.requireActual('react-native');
  return {
    ThemedView: ({ children, ...props }: Record<string, unknown>) => (
      <View {...props}>{children}</View>
    ),
  };
});

jest.mock('@/components/profilePicture', () => ({
  ProfilePicture: () => null,
}));

jest.mock('@/components/ui/icon-symbol', () => ({
  IconSymbol: () => null,
}));

jest.mock('@/app/modals/action', () => () => null);

describe('ProfileScreen', () => {
  const mockUser = { id: 'user-abc' };
  const mockProfileRow = {
    id: mockUser.id,
    profession: 'Researcher',
    contact_info: 'user@email.com',
    about_me: 'About me text',
    interests: 'AI, ML',
    my_sessions: 'Session 1',
    avatar_url: null,
  };
  const mockUserRow = {
    first_name: 'Alice',
    last_name: 'Smith',
  };

  // Helper to mock Supabase chain, essentially creating a fake query builder that resolves to { data, error }
  const makeChain = (
    data: Record<string, unknown> | null,
    error: string | null = null,
  ) => {
    const chain = Promise.resolve({ data, error }) as unknown as Record<
      string,
      jest.Mock
    >;
    ['select', 'eq', 'order', 'delete', 'single'].forEach((m) => {
      chain[m] = jest.fn(() => chain);
    });
    return chain;
  };

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
    // Default: profile and user row
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'profiles') return makeChain(mockProfileRow);
      if (table === 'users') return makeChain(mockUserRow);
      return makeChain(null, 'Unknown table');
    });
  });

  test('renders own profile with details', async () => {
    const { getByText } = render(<ProfileScreen />);
    await waitFor(() => expect(getByText('Alice Smith')).toBeTruthy());
    expect(getByText('Researcher')).toBeTruthy();
    expect(getByText('user@email.com')).toBeTruthy();
    expect(getByText('About Me')).toBeTruthy();
    expect(getByText('About me text')).toBeTruthy();
    expect(getByText('Interests')).toBeTruthy();
    expect(getByText('AI, ML')).toBeTruthy();
    expect(getByText('My Sessions')).toBeTruthy();
    expect(getByText('Session 1')).toBeTruthy();
  });
});

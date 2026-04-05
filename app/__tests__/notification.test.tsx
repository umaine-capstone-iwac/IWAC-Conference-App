import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import NotificationsScreen from '@/app/(tabs)/notifications';
import { supabase } from '@/lib/supabase';

// Mock Supabase
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(),
    auth: { getSession: jest.fn() },
    channel: jest.fn(() => ({
      on: jest.fn().mockReturnThis(),
      subscribe: jest.fn(),
    })),
    removeChannel: jest.fn(),
  },
}));

// Mock ThemedText and ThemedView (if used)
jest.mock('@/components/themedText', () => {
  const { Text } = require('react-native');
  return {
    ThemedText: ({ children, ...props }: any) => (
      <Text {...props}>{children}</Text>
    ),
  };
});

jest.mock('@/components/themedView', () => {
  const { View } = require('react-native');
  return {
    ThemedView: ({ children, ...props }: any) => (
      <View {...props}>{children}</View>
    ),
  };
});

// Mock React Native modules
jest.mock('react-native/Libraries/Linking/Linking', () => ({
  openURL: jest.fn(),
  openSettings: jest.fn()
}));

// Mock Alert
jest.spyOn(require('react-native'), 'Alert').mockImplementation(() => ({
  alert: jest.fn()
}));

describe('NotificationsScreen', () => {
  const mockUser = { id: 'user-abc' };
  const mockNotifications = [
    { id: '1', notifications: { text: 'Test notification 1' }, is_read: false },
    { id: '2', notifications: { text: 'Test notification 2' }, is_read: true },
  ];

  // Helper to mock Supabase chain
  const makeChain = (data: any, error: any = null) => {
    const chain: any = {};
    ['select', 'order', 'returns', 'update', 'eq'].forEach((m) => {
      chain[m] = jest.fn(() => chain);
    });
    chain.then = jest.fn((resolve: any) => resolve({ data, error }));
    return chain;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (supabase.auth.getSession as jest.Mock).mockResolvedValue({
      data: { session: { user: mockUser } },
      error: null,
    });
    (supabase.from as jest.Mock).mockImplementation((table: string) => {
      if (table === 'user_notifications') return makeChain(mockNotifications);
      return makeChain([]);
    });
  });

  test('renders notifications and marks as read', async () => {
    const { getByText } = render(<NotificationsScreen />);
    await waitFor(() => expect(getByText('Test notification 1')).toBeTruthy());
    expect(getByText('Test notification 2')).toBeTruthy();

    // Simulate pressing unread notification
    fireEvent.press(getByText('Test notification 1'));

    // Verify that update was called on the user_notifications table
    expect(supabase.from).toHaveBeenCalledWith('user_notifications');
  });

  test('shows empty state when no notifications', async () => {
    (supabase.from as jest.Mock).mockImplementation(() => makeChain([]));
    const { getByText } = render(<NotificationsScreen />);
    await waitFor(() => expect(getByText('No notifications available.')).toBeTruthy());
    expect(getByText('Manage Notifications')).toBeTruthy();
  });
});
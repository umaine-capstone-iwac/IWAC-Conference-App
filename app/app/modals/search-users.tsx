import { Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { Input } from '@/components/input';
import { ProfilePicture } from '@/components/profile-picture';
import { router } from 'expo-router';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { filterUsers } from '@/utils/filterUsers';
import { supabase } from '@/lib/supabase';

export default function SearchUsersScreen() {
  // -- STATE -- //

  const [userID, setUserID] = useState<string>();

  const [users, setUsers] = useState<
    {
      id: string;
      first_name: string | null;
      last_name: string | null;
      avatar_url: string | null;
    }[]
  >([]);

  const [search, setSearch] = useState('');

  // -- DERIVED DATA -- //

  // Filter users based on search input
  const filteredUsers = useMemo(() => {
    return filterUsers(users, search);
  }, [users, search]);

  // -- DATA LOADING -- //

  // Load all users except the current user
  const loadUsers = useCallback(async () => {
    if (!userID) return;

    // Fetch all other users
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('id, first_name, last_name')
      .neq('id', userID);

    if (usersError || !usersData) {
      console.error('Error loading other users:', usersError);
      return;
    }

    // Fetch profiles for these users to get avatar URLs
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('id, avatar_url')
      .in(
        'id',
        usersData.map((u) => u.id),
      );

    if (profilesError || !profilesData) {
      console.error('Error loading profiles:', profilesError);
    }

    // Merge avatar URLs into users
    const usersWithAvatars = usersData.map((user) => {
      const profile = profilesData?.find((p) => p.id === user.id);
      return { ...user, avatar_url: profile?.avatar_url ?? null };
    });

    setUsers(usersWithAvatars);
  }, [userID]);

  // -- AUTH INITIALIZATION -- //

  // Fetch the logged-in user's ID on mount
  useEffect(() => {
    const loadUser = async () => {
      setUserID((await supabase.auth.getSession()).data.session?.user.id);
    };
    loadUser();
  }, []);

  // -- SCREEN EFFECTS -- //

  // Load users once current user is known
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // -- UI -- //

  return (
    <SafeAreaView style={styles.container}>
      <Input
        text="Search users..."
        style={styles.searchBar}
        onChangeText={setSearch}
      />

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              router.dismissAll();
              router.push(`/conversation?otherUserID=${item.id}`);
            }}
            style={styles.userRow}
          >
            <ProfilePicture
              size={40}
              avatarUrl={item.avatar_url}
              userId={item.id}
            />
            <Text style={styles.userText}>
              {item.first_name} {item.last_name}
            </Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: Colors.lightestBlue,
  },
  userRow: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderColor: Colors.lightBlue,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
  },
  userText: {
    fontSize: 18,
  },
  searchBar: {
    maxHeight: 50,
    fontSize: 16,
  },
});

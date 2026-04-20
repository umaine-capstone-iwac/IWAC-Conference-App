import { Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';
import { Input } from '@/components/input';
import { ProfilePicture } from '@/components/profilePicture';
import { router } from 'expo-router';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { filterUsers } from '@/utils/filterUsers';
import { supabase } from '@/lib/supabase';

export default function SearchUsersScreen() {
  // -- STATE -- //

  // Current authenticated user's ID
  const [userID, setUserID] = useState<string>();

  // All other users (with avatar data attached)
  const [users, setUsers] = useState<
    {
      id: string;
      first_name: string | null;
      last_name: string | null;
      avatar_url: string | null;
      isBlockedByMe?: boolean;
      isBlockedByThem?: boolean;
    }[]
  >([]);

  // Search input state
  const [search, setSearch] = useState('');

  // -- DERIVED DATA -- //

  // Filter users based on search input
  const filteredUsers = useMemo(() => {
    return filterUsers(users, search);
  }, [users, search]);

  // -- AUTH INITIALIZATION -- //

  // Fetch the logged-in user's ID on mount
  useEffect(() => {
    const loadUser = async () => {
      setUserID((await supabase.auth.getSession()).data.session?.user.id);
    };
    loadUser();
  }, []);

  // -- DATA FETCHING -- //

  // Load all users except for the current user
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

    // Fetch block relationships involving current user
    const { data: blocksData, error: blocksError } = await supabase
      .from('blocks')
      .select('blocker_user_id, blocked_user_id')
      .or(`blocker_user_id.eq.${userID},blocked_user_id.eq.${userID}`);

    if (blocksError) {
      console.error('Error loading blocks:', blocksError);
    }

    // Fetch avatar url profile data
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

    // Merge avatar URLs and blocked status into user records
    const mergedUsers = usersData.map((user) => {
      const profile = profilesData?.find((p) => p.id === user.id);

      const isBlockedByMe = blocksData?.some(
        (b) => b.blocker_user_id === userID && b.blocked_user_id === user.id,
      );

      const isBlockedByThem = blocksData?.some(
        (b) => b.blocker_user_id === user.id && b.blocked_user_id === userID,
      );

      return {
        ...user,
        avatar_url: profile?.avatar_url ?? null,
        isBlockedByMe: !!isBlockedByMe,
        isBlockedByThem: !!isBlockedByThem,
      };
    });

    setUsers(mergedUsers);
  }, [userID]);

  // -- SCREEN EFFECTS -- //

  // Load users once current user is known
  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // -- UI -- //

  return (
    <SafeAreaView style={styles.container}>
      <Input text="Search users..." onChangeText={setSearch} />

      <FlatList
        data={filteredUsers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            onPress={() => {
              router.back();

              // If block either way, move to profile
              if (item.isBlockedByThem || item.isBlockedByMe) {
                router.push(`/profile?otherUserID=${item.id}`);
              }
              // Otherwise, move to conversation
              else {
                router.push(`/conversation?otherUserID=${item.id}`);
              }
            }}
            style={styles.userRow}
          >
            <ProfilePicture
              size={40}
              avatarUrl={item.avatar_url}
              userId={item.id}
            />
            <Text
              style={[
                styles.userText,
                item.isBlockedByMe
                  ? { color: 'red' }
                  : item.isBlockedByThem
                    ? { color: 'gray' }
                    : null,
              ]}
            >
              {item.first_name} {item.last_name}
            </Text>
          </Pressable>
        )}
      />
    </SafeAreaView>
  );
}

// -- STYLES -- //

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
});

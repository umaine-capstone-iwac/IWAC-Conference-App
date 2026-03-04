import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { ProfilePicture } from '@/components/profile-picture';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useState, useEffect, useCallback } from 'react';

interface ProfileDetails {
  // Defines the profile details structure
  id: string;
  first_name: string;
  last_name: string;
  profession: string;
  about_me: string;
  interests: string;
  my_sessions: string;
  avatar_url: string | null;
}

export default function ProfileScreen() {
  // -- STATE -- //
  const [userID, setUserID] = useState<string>(); // State to hold the logged in user's ID
  const [profile, setProfileData] = useState<ProfileDetails | null>(null); // State to hold profile details from supabase
  const { otherUserID } = useLocalSearchParams();
  const viewedUserID = otherUserID ? String(otherUserID) : userID;
  const isOwnProfile =
    userID && viewedUserID && String(userID) === String(viewedUserID);
  
  // -- DATA LOADING -- //

  //fetch the logged in user's ID
  useEffect(() => {
    const loadUser = async () => {
      setUserID((await supabase.auth.getSession()).data.session?.user?.id);
    };
    loadUser();
  }, []);

  // Fetch profile data for the user you wish to view
  const fetchProfileData = useCallback(async () => {
    if (!viewedUserID) return; //Don't load if we don't have a user ID to fetch for

    try {
      const [
        { data: profileRow, error: pErr },
        { data: userRow, error: uErr },
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select(
            'id, profession, about_me, interests, my_sessions, avatar_url',
          )
          .eq('id', viewedUserID) // Filter to get only the logged in user's profile data
          .single(), //expecting a single profile row for the user ID

        //Now to get the names
        supabase
          .from('users')
          .select('first_name, last_name')
          .eq('id', viewedUserID)
          .single(),
      ]);

      if (pErr || uErr) {
        console.error('Error fetching profile data:', pErr ?? uErr);
        setProfileData(null);
        return;
      }

      //map the data into a structure we want
      const mapped = {
        id: profileRow.id,
        first_name: userRow?.first_name ?? '',
        last_name: userRow?.last_name ?? '',
        profession: profileRow.profession ?? '',
        about_me: profileRow.about_me ?? '',
        interests: profileRow.interests ?? '',
        my_sessions: profileRow.my_sessions ?? '',
        avatar_url: profileRow.avatar_url,
      } as ProfileDetails;

      setProfileData(mapped); // Update state with fetched profile data
    } catch (err) {
      console.error('Unexpected error fetching profile data:', err);
    }
  }, [viewedUserID]);

  // -- SCREEN LIFECYCLE -- //

  // Fetch profile data when the screen loads or when the viewed user ID changes
  useEffect(() => {
    // fetch once when userID becomes available
    if (viewedUserID) fetchProfileData();
  }, [viewedUserID, fetchProfileData]);

  // -- UI -- //
  return (
    <ScrollView style={{ backgroundColor: Colors.awac.beige }}>
      <ThemedView style={styles.profileContainer}>
        <ProfilePicture
          size={75}
          avatarUrl={profile?.avatar_url}
          userId={profile?.id}
        />
        <View style={{ flexDirection: 'column', gap: 8 }}>
          {profile ? (
            <View key={profile.id}>
              <ThemedText type="title" style={{ fontSize: 26 }}>
                {profile.first_name} {profile.last_name}
              </ThemedText>
              <ThemedText type="subtitle" style={{ fontSize: 16 }}>
                {profile.profession}
              </ThemedText>
            </View>
          ) : null}
          {isOwnProfile && (
            <Pressable onPress={() => router.push('/profilesettings')}>
              <View style={styles.editButton}>
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </View>
            </Pressable>
          )}

          {!isOwnProfile && viewedUserID && (
            <Pressable
              onPress={() =>
                router.push(`/conversation?otherUserID=${viewedUserID}`)
              }
            >
              <View style={styles.editButton}>
                <Text style={styles.editButtonText}>Message User</Text>
              </View>
            </Pressable>
          )}
        </View>
      </ThemedView>
      <ThemedView style={styles.sectionContainer}>
        {profile ? (
          <View key={profile.id}>
            <ThemedText type="subtitle">About Me</ThemedText>
            <ThemedText>{profile.about_me}</ThemedText>
          </View>
        ) : null}
      </ThemedView>
      <ThemedView style={styles.sectionContainer}>
        {profile ? (
          <View key={`${profile.id}-interests`}>
            <ThemedText type="subtitle">Interests</ThemedText>
            <ThemedText>{profile.interests}</ThemedText>
          </View>
        ) : null}
      </ThemedView>
      <ThemedView style={styles.sectionContainer}>
        {profile ? (
          <View key={`${profile.id}-sessions`}>
            <ThemedText type="subtitle">My sessions</ThemedText>
            <ThemedText>{profile.my_sessions}</ThemedText>
          </View>
        ) : null}
      </ThemedView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileContainer: {
    backgroundColor: Colors.lightestBlue,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    justifyContent: 'space-around',
    marginBottom: 10,
  },
  sectionContainer: {
    gap: 8,
    margin: 10,
    padding: 10,
    borderColor: Colors.awac.navy,
    borderWidth: 2,
    borderRadius: 8,
    // backgroundColor: Colors.awac.beige,
  },
  editButton: {
    backgroundColor: Colors.umaine.darkBlue,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  editButtonText: {
    color: Colors.awac.beige,
    fontSize: 14,
    fontWeight: '600',
  },
});

import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { ProfilePicture } from '@/components/profile-picture';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { router, useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from '@react-navigation/native';

interface ProfileDetails {
  // Defines the profile details structure
  id: string;
  first_name: string;
  last_name: string;
  profession: string;
  about_me: string;
  interests: string;
  my_sessions: string;
}

export default function ProfileScreen() {
  const [userID, setUserID] = useState<string>(); // State to hold the logged in user's ID
  const [profile, setProfileData] = useState<ProfileDetails | null>(null); // State to hold profile details from supabase
  const { userID: routeUserID, otherUserID } = useLocalSearchParams(); // Get userID from route parameters if available
  const viewedUserID = routeUserID ?? otherUserID ?? userID; // Determine which userID to use for fetching profile data (route parameter or logged in user). used for viewing other peoples' profiles

  console.log('userID: ', userID);
  //fetch the logged in user's ID
  useEffect(() => {
    const loadUser = async () => {
      setUserID((await supabase.auth.getSession()).data.session?.user?.id);
    };
    loadUser();
  }, []);

  const fetchProfileData = useCallback(async () => {
    const idToFetch = routeUserID ?? otherUserID ?? userID; // Determines which user to display based on route parameters, or logged in user ID
    if (!idToFetch) return; //Don't load if we don't have a user ID to fetch for

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(
          'id, first_name, last_name, profession, about_me, interests, my_sessions',
        )
        .eq('id', idToFetch) // Filter to get only the logged in user's profile data
        .single(); // Expecting a single profile row for the user ID
      console.log('fetchProfileData response:', { userID, data, error });

      if (error) {
        console.error('Error fetching profile data:', error);
        setProfileData(null);
        return;
      }
      setProfileData((data as ProfileDetails) || null); // Update state with fetched profile data
    } catch (err) {
      console.error('Unexpected error fetching profile data:', err);
    }
  }, [userID, routeUserID, otherUserID]);

  useEffect(() => {
    // fetch once when userID becomes available
    if (userID) fetchProfileData();
  }, [userID, fetchProfileData]);

  // re-fetch whenever the screen gains focus
  useFocusEffect(
    useCallback(() => {
      fetchProfileData();
    }, [fetchProfileData]),
  );

  return (
    <ScrollView style={{ backgroundColor: Colors.awac.beige }}>
      <ThemedView style={styles.profileContainer}>
        <ProfilePicture
          size={75}
          source={require('@/assets/images/profile-picture.png')}
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
          {viewedUserID && userID === viewedUserID ? ( // Only show edit button if we're viewing our own profile
            <Pressable onPress={() => router.push('/profilesettings')}>
              <View style={styles.editButton}>
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </View>
            </Pressable>
          ) : viewedUserID ? ( // Only show message button if we're viewing someone else's profile
            <Pressable
              onPress={() =>
                router.push(`/conversation?otherUserID=${viewedUserID}`)
              }
            >
              <View style={styles.editButton}>
                <Text style={styles.editButtonText}>Message User</Text>
              </View>
            </Pressable>
          ) : null}
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

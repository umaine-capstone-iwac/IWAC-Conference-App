import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Image,
} from 'react-native';
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
  avatar_url: string | null;
}

export default function ProfileScreen() {
  const [userID, setUserID] = useState<string>(); // State to hold the logged in user's ID
  const [profile, setProfileData] = useState<ProfileDetails | null>(null); // State to hold profile details from supabase
  const { userID: routeUserID, otherUserID } = useLocalSearchParams(); // Get userID from route parameters if available
  const viewedUserID = routeUserID ?? userID; // Determine which userID to use for fetching profile data (route parameter or logged in user). used for viewing other peoples' profiles

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
      const [
        { data: profileRow, error: pErr },
        { data: userRow, error: uErr },
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select(
            'id, profession, about_me, interests, my_sessions, avatar_url',
          )
          .eq('id', idToFetch) // Filter to get only the logged in user's profile data
          .single(), //expecting a single profile row for the user ID

        //Now to get the names
        supabase
          .from('users')
          .select('first_name, last_name')
          .eq('id', idToFetch)
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
        {profile?.avatar_url ? (
          <Image
            key={profile.avatar_url + String(Date.now())} // force remount / avoid stale cache
            source={{
              uri:
                typeof profile.avatar_url === 'string'
                  ? `${profile.avatar_url}${profile.avatar_url.includes('?') ? '&' : '?'}t=${Date.now()}`
                  : undefined,
            }}
            style={{
              width: 75,
              height: 75,
              borderRadius: 37.5,
            }}
            onError={(e) => {
              console.error('Profile image load error:', e.nativeEvent);
            }}
            accessibilityLabel="Profile picture"
          />
        ) : (
          <ProfilePicture
            size={75}
            source={require('@/assets/images/profile-picture.png')}
          />
        )}
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

import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { ProfilePicture} from '@/components/profile-picture';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { router } from 'expo-router';
import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useState, useEffect } from 'react';




interface ProfileDetails { // Defines the profile details structure
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
  const [profileData, setProfileData] = useState<ProfileDetails[]>([]); // State to hold profile details from supabase
  console.log("userID: ", userID);
  //fetch the logged in user's ID
  useEffect(() => {
    const loadUser = async () => {
      setUserID((await supabase.auth.getSession()).data.session?.user?.id);
    };
    loadUser();
  }, []);
  

  useEffect(() => {
    if (!userID) return; // If userID is not available, do not attempt to fetch profile data

    // Function to fetch profile data from supabase
    const fetchProfileData = async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, first_name, last_name, profession, about_me, interests, my_sessions')
          .eq('id', userID); // Filter to get only the logged in user's profile data
          console.log("user ID: ", userID);
        if (error) {
          console.error('Error fetching profile data:', error);
          return;
        }
        setProfileData((data as ProfileDetails[]) || []); // Update state with fetched profile data
      
    }
    fetchProfileData();
  }, [userID]); // Dependency array ensures this runs when userID changes

  
  return (
    <ScrollView style = {{backgroundColor: Colors.awac.beige}}>
      <ThemedView style={styles.profileContainer}> 
          <ProfilePicture size={75} source={require('@/assets/images/profile-picture.png')} />
          <View style = {{ flexDirection: 'column', gap: 8 }}>
            {profileData.map((profile) => (
              <View key={profile.id}>
                <ThemedText type="title" style={{fontSize: 26}}>{profile.first_name} {profile.last_name}</ThemedText> 
                <ThemedText type="subtitle" style={{fontSize: 16}}>{profile.profession}</ThemedText>
              </View>
            ))}
              <Pressable onPress={() => router.push("/profilesettings")}>
                <View style = {styles.editButton}>
                  <Text style={styles.editButtonText}>Edit Profile</Text>
                </View>
              </Pressable>
          </View>
      </ThemedView>
      <ThemedView style={styles.sectionContainer}>
          {profileData.map((profile) => (
            <View key={profile.id}>
              <ThemedText type="subtitle">About Me</ThemedText>
              <ThemedText>{profile.about_me}</ThemedText>
            </View>
          ))}
      </ThemedView>
      <ThemedView style={styles.sectionContainer}>
          {profileData.map((profile) => (
            <View key={profile.id}>
              <ThemedText type="subtitle">Interests</ThemedText>
              <ThemedText>{profile.interests}</ThemedText>
            </View>
          ))}
      </ThemedView>
      <ThemedView style={styles.sectionContainer}>
          {profileData.map((profile) => (
            <View key={profile.id}>
              <ThemedText type="subtitle">My sessions</ThemedText>
              <ThemedText>{profile.my_sessions}</ThemedText>
            </View>
          ))}
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

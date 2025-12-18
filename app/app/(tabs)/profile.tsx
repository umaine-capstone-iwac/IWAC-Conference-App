import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { ProfilePicture} from '@/components/profile-picture';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link, router } from 'expo-router';
import { Colors } from '@/constants/theme';

export default function ProfileScreen() {
  return (
      <ScrollView style = {{backgroundColor: Colors.awac.beige}}>
          {/* flex box for the profile picture to be in the same line as the profile name, similar to the messages */}
        <ThemedView style={styles.profileContainer}> 
            <ProfilePicture size={75} source={require('@/assets/images/profile-picture.png')} /> 
            <View style = {{ flexDirection: 'column', gap: 8 }}>
              <ThemedText type="title" style={{fontSize: 26}}>John Doe</ThemedText>
              <ThemedText type="subtitle" style={{fontSize: 16}}>PenUltimate  CEO</ThemedText>
            </View>
            <Pressable onPress={() => router.push("/modals/profilesettings")}>
              <View style = {styles.editButton}>
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </View>
            </Pressable>
        </ThemedView>
        <ThemedView style={styles.sectionContainer}>
            <ThemedText type="subtitle">About Me</ThemedText>
            <ThemedText>
                Hello! I'm John, a software developer with a love for creating intuitive and dynamic user experiences. When I'm not coding, you can find me exploring the great outdoors or capturing moments through my lens.
            </ThemedText>
        </ThemedView>
        <ThemedView style={styles.sectionContainer}>
            <ThemedText type="subtitle">Interests</ThemedText>
            <ThemedText>
                - Coding and Software Development{'\n'}
                - Hiking and Nature Walks{'\n'}
                - Photography and Visual Arts{'\n'}
                - Traveling and Exploring New Cultures
            </ThemedText>
        </ThemedView>
        <ThemedView style={styles.sectionContainer}>
            <ThemedText type="subtitle">My sessions</ThemedText>
            <ThemedText>
                - Advanced AI Techniques{'\n'}
                - The Contrasts Between Writing in STEM, Arts, and hHumanities{'\n'}
                - How to Improve a Research Paper{'\n'}
                - Exploring Historical Literature
            </ThemedText>
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

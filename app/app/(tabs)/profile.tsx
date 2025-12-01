import { Image } from 'expo-image';
import { Platform, StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView} from 'react-native-safe-area-context';
import { ProfilePicture} from '@/components/profile-picture';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link } from 'expo-router';
import {Input} from '@/components/input';
import { Colors } from '@/constants/theme';
import ParallaxScrollView from '@/components/parallax-scroll-view';

export default function ProfileScreen() {
  return (
      <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC'}}
      headerImage={
        <Image
          source={require('@/assets/images/profile-picture.png')}
          style={styles.headerImage}
          />
        }>
        <ThemedView style={styles.profileContainer}> 
            <TouchableOpacity style={styles.editButton}>
                <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
            <ThemedText type="title">John Doe</ThemedText>
            <ThemedText type="subtitle">PenUltimate  CEO</ThemedText>
        </ThemedView>
        <ThemedView style={styles.sectionContainer}>
            <ThemedText type="subtitle">About Me</ThemedText>
            <ThemedText>
                Hello! I'm John, a software developer with a love for creating intuitive and dynamic user experiences. When I'm not coding, you can find me exploring the great outdoors or capturing moments through my lens.
            </ThemedText>
        </ThemedView>
        <ThemedView>
            <ThemedText type="subtitle">Interests</ThemedText>
            <ThemedText>
                - Coding and Software Development{'\n'}
                - Hiking and Nature Walks{'\n'}
                - Photography and Visual Arts{'\n'}
                - Traveling and Exploring New Cultures
            </ThemedText>
        </ThemedView>
        </ParallaxScrollView>

  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
    profileContainer: {
    padding: 20,
    paddingTop: 0,
    alignItems: 'flex-start',
  },
  sectionContainer: {
    gap: 8,
    marginBottom: 8,
  },
  editButton: {
    backgroundColor: Colors.umaine.darkBlue,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-end',
    marginRight: 20,
    marginBottom: 20,
  },
  editButtonText: {
    color: Colors.awac.beige,
    fontSize: 12,
    fontWeight: '600',
  },
  headerImage: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
}); 

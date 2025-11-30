import { Image } from 'expo-image';
import { Platform, StyleSheet, Text, View, ScrollView } from 'react-native';
import { SafeAreaView} from 'react-native-safe-area-context';
import { ProfilePicture} from '@/components/profile-picture';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link } from 'expo-router';
import {Input} from '@/components/input';
import { Colors } from '@/constants/theme';


export default function HomeScreen() {
  return (
      <ScrollView style={styles.scrollContainer}
        >
        {/* <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Messages!</ThemedText>
          <HelloWave />
        </ThemedView> */}
        <View style={styles.messagesContainer}>
          <View style= {styles.searchBarContainer}>
            <Input text = "Search for a message..." style = {styles.searchBar}/>
            <View style={styles.searchIcon}>
                  <Text style = {{fontWeight: 'bold', fontSize: 24}}> + </Text>
            </View>
          </View>
          <Link href="/conversation" asChild>
            <View style={styles.messageContainer}>
              <ProfilePicture size={40} source={require('@/assets/images/profile-picture.png')} />
              <View>
                <ThemedText type="title" style={{fontSize: 22}}>Shelly Smith</ThemedText> 
                <ThemedText>Hi Shelly! I loved your presentation on...</ThemedText> 
              </View>
            </View>
          </Link>
          <View style={styles.messageContainer}>
            <ProfilePicture size={40} source={require('@/assets/images/profile-picture.png')} />
            <View>
              <ThemedText type="title" style={{fontSize: 22}}>Shelly Smith </ThemedText> 
              <ThemedText>Hi Shelly! I loved your presentation on... </ThemedText> 
            </View>
          </View>
          <View style={styles.messageContainer}>
            <ProfilePicture size={40} source={require('@/assets/images/profile-picture.png')} />
            <View>
              <ThemedText type="title" style={{fontSize: 22}}> Jillian Moore </ThemedText> 
              <ThemedText> Are you going to the 2:00 seminar on... </ThemedText> 
            </View>
          </View>
          <View style={styles.messageContainer}>
            <ProfilePicture size={40} source={require('@/assets/images/profile-picture.png')} />
            <View>
              <ThemedText type="title" style={{fontSize: 22}}>Javier Martínez </ThemedText> 
              <ThemedText>That's a great question! I believe that...  </ThemedText> 
            </View>
          </View>
        </View>
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scrollContainer: {
    backgroundColor: Colors.awac.beige
  },
  messagesContainer: {
    flexDirection: 'column',
    gap: 25,
    marginBottom: 8,
    padding: 20,
    borderRadius: 10,
  },
  messageContainer: {
    backgroundColor: Colors.lightestBlue,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    borderWidth: 2,
    borderRadius: 10,
    borderColor: Colors.awac.navy,
    padding: 10
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: 'absolute',
  },
  searchIcon: {
    width: 50,
    backgroundColor : Colors.lightestBlue,
    borderWidth: 2,
    borderColor: 'grey',
    borderRadius: 10,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBarContainer: {
      flexDirection: 'row',
      gap: 15
  },
  searchBar: {
    height: 50,     
    fontSize: 16,  
  }
});
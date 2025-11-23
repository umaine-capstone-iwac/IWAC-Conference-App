import { Image } from 'expo-image';
import { Platform, StyleSheet, View, ScrollView } from 'react-native';
import { SafeAreaView} from 'react-native-safe-area-context';
import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link } from 'expo-router';
import { Colors } from '@/constants/theme';


export default function HomeScreen() {
  return (
      <ScrollView
        >
        {/* <ThemedView style={styles.titleContainer}>
          <ThemedText type="title">Messages!</ThemedText>
          <HelloWave />
        </ThemedView> */}
        <View style={styles.messagesContainer}>
          <View style={styles.messageContainer}>
            <ThemedText type="title">Message 1!</ThemedText>
            <HelloWave />
          </View>
          <View style={styles.messageContainer}>
            <ThemedText type="title">Message 2!</ThemedText>
            <HelloWave />
          </View>
          <View style={styles.messageContainer}>
            <ThemedText type="title">Message 3!</ThemedText>
            <HelloWave />
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
  messagesContainer: {
    flexDirection: 'column',
    gap: 20,
    marginBottom: 8,
    padding: 20,
    borderRadius: 10,
  },
  messageContainer: {
    backgroundColor: Colors.lightestBlue,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
});

import { StyleSheet, Text, View, ScrollView, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';

// example data
const conferenceEvents = [
  {
    id: 1,
    title: 'Opening from IWAC Staff',
    time: '9:00 AM - 10:30 AM',
    location: 'Memorial Union',
    speaker: 'Dr. Heather Falconer',
    date: 'Monday, Dec 2'
  },
  {
    id: 2,
    title: 'Advanced AI Techniques',
    time: '11:00 AM - 12:30 PM',
    location: 'Ferland Room 214',
    speaker: 'Prof. Chen',
    date: 'Monday, Dec 2'
  },
  {
    id: 3,
    title: 'Writing in the Classroom',
    time: '2:00 PM - 3:30 PM',
    location: 'Foster Center',
    speaker: 'Prof. Dufour',
    date: 'Monday, Dec 2'
  }
];

export default function AgendaScreen() {
  return (
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.browseButton}>
          <Text style={styles.browseButtonText}>Browse More Events</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.eventsContainer}>
        {conferenceEvents.map((event) => (
          <View key={event.id} style={styles.eventCard}>
            <TouchableOpacity style={styles.removeButton}>
              <Text style={styles.removeButtonText}>✕</Text>
            </TouchableOpacity>
            
            <View style={styles.dateTag}>
              <Text style={styles.dateText}>{event.date}</Text>
            </View>
            
            <ThemedText type="title" style={styles.eventTitle}>
              {event.title}
            </ThemedText>
            
            <View style={styles.eventDetails}>
              <View style={styles.detailRow}>
                <IconSymbol size={18} name="clock.fill" color={Colors.awac.navy} />
                <ThemedText style={styles.detailText}>{event.time}</ThemedText>
              </View>
              
              <View style={styles.detailRow}>
                <IconSymbol size={18} name="mappin.circle.fill" color={Colors.awac.navy} />
                <ThemedText style={styles.detailText}>{event.location}</ThemedText>
              </View>
              
              <View style={styles.detailRow}>
                <IconSymbol size={18} name="person.fill" color={Colors.awac.navy} />
                <ThemedText style={styles.detailText}>{event.speaker}</ThemedText>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: Colors.awac.beige,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
  },
  browseButton: {
    backgroundColor: Colors.umaine.darkBlue,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
  },
  browseButtonText: {
    color: Colors.awac.beige,
    fontSize: 12,
    fontWeight: '600',
  },
  eventsContainer: {
    padding: 20,
    paddingTop: 0,
    gap: 20,
  },
  eventCard: {
    backgroundColor: Colors.lightestBlue,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.awac.navy,
    padding: 15,
    gap: 12,
    position: 'relative',
  },
  dateTag: {
    backgroundColor: Colors.umaine.lightBlue,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.awac.navy,
  },
  eventTitle: {
    fontSize: 18,
  },
  eventDetails: {
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
  },
  removeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#FF4444',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  removeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 18,
  },
});
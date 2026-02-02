import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

interface ConferenceEvent { //defines event objects
  id: number;
  title: string;
  time: string;
  location: string;
  speaker: string;
  date: string;
}


export default function MyAgendaScreen() {
  const [myEvents, setMyEvents] = useState<ConferenceEvent[]>([]); // stores events pulled from database
  const [loading, setLoading] = useState(true);


  useEffect(() => {
    fetchAgenda();
  }, []);


  const fetchAgenda = async () => { // fetches rows from user agenda
    try {
      const { data, error } = await supabase
        .from('user_agenda')
        .select(`
          id,
          conference_events (
            id,
            title,
            time,
            location,
            speaker,
            date
          )
        `)
        .order('created_at', { ascending: true });


      console.log('Agenda rows:', data);


      if (error) throw error;


      const events =
        data?.map((row: any) => row.conference_events).filter(Boolean) ?? [];


      setMyEvents(events);
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to load agenda');
    } finally {
      setLoading(false);
    }
  };


  const removeFromAgenda = async (eventId: number) => { //deletes event from myagenda
    try {
      const { error } = await supabase
        .from('user_agenda')
        .delete()
        .eq('event_id', eventId);


      if (error) throw error;


      setMyEvents(prev => prev.filter(e => e.id !== eventId));
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to remove event');
    }
  };


  if (loading) {
    return (
      <View style={[styles.scrollContainer, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.umaine.darkBlue} />
      </View>
    );
  }


  if (myEvents.length === 0) { // empty state
    return (
      <View style={[styles.scrollContainer, styles.centerContent]}>
        <ThemedText>No events yet.</ThemedText>
      </View>
    );
  }


  return ( //renders a card for each event
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.eventsContainer}>
        {myEvents.map(event => (
          <View key={event.id} style={styles.eventCard}>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => removeFromAgenda(event.id)}
            >
              <Text style={styles.removeButtonText}>✕</Text>
            </TouchableOpacity>


            <View style={styles.dateTag}>
              <Text style={styles.dateText}>{event.date}</Text>
            </View>


            <ThemedText type="title">{event.title}</ThemedText>


            <View style={styles.detailRow}>
              <IconSymbol size={18} name="clock.fill" color={Colors.awac.navy} />
              <ThemedText>{event.time}</ThemedText>
            </View>


            <View style={styles.detailRow}>
              <IconSymbol size={18} name="mappin.circle.fill" color={Colors.awac.navy} />
              <ThemedText>{event.location}</ThemedText>
            </View>


            <View style={styles.detailRow}>
              <IconSymbol size={18} name="person.fill" color={Colors.awac.navy} />
              <ThemedText>{event.speaker}</ThemedText>
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
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
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
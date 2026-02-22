import { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';

interface ConferenceEvent { //defines event objects
  id: number;
  title: string;
  location: string;
  speaker: string;
  date: string;
  session: string;
  tag: string;
}

//response from supabase
interface UserAgendaResponse {
  id: number;
  event_id: number;
  user_id: string;
  created_at: string;
  conference_events: ConferenceEvent;
}

export default function MyAgendaScreen() {
  const [myEvents, setMyEvents] = useState<ConferenceEvent[]>([]); // stores events pulled from database
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();


  useEffect(() => {
    // NOTE: Temporary sign-in for testing. Remove after login logic complete.
    const signIn = async () => {
      const { error } = await supabase.auth.signInWithPassword({
        email: 'test@test.com',
        password: 'testUser123?',
      });

      if (error) {
        console.error('Auth error:', error.message);
      }
      else {
        console.log((await supabase.auth.getSession()).data.session?.user);
        fetchAgenda();
      }
    };
    signIn();
  }, []);


  const fetchAgenda = async () => { // fetches rows from user agenda
    try {
      const { data: { user } } = await supabase.auth.getUser();
     
      if (!user) {
        Alert.alert('Error', 'Please log in to view your agenda');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_agenda')
        .select(`
          id,
          conference_events (
            id,
            title,
            location,
            speaker,
            date,
            session,
            tag
          )
        `)
        .eq('user_id', user.id) // fetches agenda rows for specific user
        .order('created_at', { ascending: true });


      if (error) throw error;


      // type assertion for the joined data
      const typedData = data as unknown as UserAgendaResponse[];
     
      const events: ConferenceEvent[] = typedData?.map((item) => ({
        ...item.conference_events
      })) || [];
     
      events.sort((a, b) => a.session.localeCompare(b.session)); // sort panels when added

      setMyEvents(events);
    } catch (error) {
      console.error('Error fetching my agenda:', error);
      Alert.alert('Error', 'Failed to load your agenda');
    } finally {
      setLoading(false);
    }
  };


  const removeFromAgenda = async (eventId: number) => { //deletes event from user agenda
    try {

      const { data: { user } } = await supabase.auth.getUser();
     
      if (!user) {
        Alert.alert('Error', 'Please log in');
        return;
      }

      const { error } = await supabase
        .from('user_agenda')
        .delete()
        .eq('user_id', user.id)
        .eq('event_id', eventId);
      

      if (error) throw error;

      setMyEvents(myEvents.filter(event => event.id !== eventId).sort((a, b) => a.session.localeCompare(b.session))); // sort panels after deletion
     
      Alert.alert('Success', 'Event removed from your agenda');
    } catch (error) {
      console.error('Error removing event:', error);
      Alert.alert('Error', 'Failed to remove event');
    }
  };


  const navigateToBrowse = (): void => { // go to agenda page for browsing
    router.push('/sessions');
  };


  if (loading) {
    return (
      <View style={[styles.scrollContainer, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.umaine.darkBlue} />
      </View>
    );
  }


  if (myEvents.length === 0) { // show when user hasn't favorited any events
    return (
      <View style={[styles.scrollContainer, styles.centerContent, styles.padding]}>
        <ThemedText style={styles.emptyText}>
          You haven't added any events to your agenda yet.
        </ThemedText>
        <TouchableOpacity style={styles.browseButton} onPress={navigateToBrowse}>
          <Text style={styles.browseButtonText}>Browse Panels</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return ( // renders a card for each event
    <ScrollView style={styles.scrollContainer}>
      <View style={styles.headerContainer}>
        <TouchableOpacity style={styles.browseButton} onPress={navigateToBrowse}>
          <Text style={styles.browseButtonText}>Browse More Panels</Text>
        </TouchableOpacity>
      </View>
  
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
              <ThemedText>{event.session}</ThemedText>
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
  padding: {
    padding: 20,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
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
  emptyText: {
    textAlign: 'center',
    marginBottom: 20,
    fontSize: 16,
  },
});
import { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import PanelDetail, { Panel } from '@/components/panel-details';

// -- Types -- //

// Response from supabase when selecting user_agenda
interface UserAgendaResponse {
  id: number;
  event_id: number;
  user_id: string;
  created_at: string;
  conference_events: Panel;
}
// -- Components -- //

// Displays current user's favorited conference events, events fetcjed from user_agenda
export default function MyAgendaScreen() {
  const [myEvents, setMyEvents] = useState<Panel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [userID, setUserID] = useState<string | undefined>();
  const [selectedPanel, setSelectedPanel] = useState<Panel | null>(null);
  const router = useRouter();

  // Load current user
  useEffect(() => {
    const loadUser = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) { console.error(error); return; }
      setUserID(data.session?.user?.id);
    };
    loadUser();
  }, []);

  // Fetch agenda on intial mount
  useEffect(() => {
    fetchAgenda();
  }, []);

  // -- Data Fetching -- //

  // Fetches agenda of authenticated user's agenda, joins user_agenda and events tables and sorts results by session
  const fetchAgenda = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert('Error', 'Please log in to view your agenda');
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_agenda')
        .select(
          `
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
        `,
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Type assertion for the joined data
      const typedData = data as unknown as UserAgendaResponse[];

      // Sort by session label
      const events: Panel[] =
        typedData?.map((item) => ({
          ...item.conference_events,
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

  // Re-fetch every time this tab/screen becomes active
  useFocusEffect(
    useCallback(() => {
      fetchAgenda();
    }, [fetchAgenda]),
  );

  // -- Deletion -- //

  // Deletes specific event from a user's agenda locally and in Supabase
  const removeFromAgenda = async (eventId: number) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

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

      // Re-sort events by session after deltion
      setMyEvents((prev) =>
        prev
          .filter((e) => e.id !== eventId)
          .sort((a, b) => a.session.localeCompare(b.session)),
      );

      if (selectedPanel?.id === eventId) setSelectedPanel(null);

      Alert.alert('Success', 'Event removed from your agenda');
    } catch (error) {
      console.error('Error removing event:', error);
      Alert.alert('Error', 'Failed to remove event');
    }
  };

  // -- Navigation -- //

  // Go to Sessions page for browsing
  const navigateToBrowse = (): void => {
    router.push('/sessions');
  };

  // -- Rendering -- //

  // Shows spinner during initial fetch
  if (loading) {
    return (
      <View style={[styles.scrollContainer, styles.centerContent]}>
        <ActivityIndicator size="large" color={Colors.umaine.darkBlue} />
      </View>
    );
  }

   // Panel detail view — shared component
  if (selectedPanel) {
    return (
      <PanelDetail
        panel={selectedPanel}
        userID={userID}
        onBack={() => setSelectedPanel(null)}
      />
    );
  }

  // Shows button to go to Sessions if user has no favorited events
  if (myEvents.length === 0) {
    return (
      <View
        style={[styles.scrollContainer, styles.centerContent, styles.padding]}
      >
        <ThemedText style={styles.emptyText}>
          {`You haven't added any events to your agenda yet.`}
        </ThemedText>
        <TouchableOpacity
          style={styles.browseButton}
          onPress={navigateToBrowse}
        >
          <Text style={styles.browseButtonText}>Browse Panels</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Renders card for each event, each with a remove button
  return (
    <ScrollView style={styles.scrollContainer}>
      {/* Header row with a shortcut to browse more panels */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.browseButton}
          onPress={navigateToBrowse}
        >
          <Text style={styles.browseButtonText}>Browse More Panels</Text>
        </TouchableOpacity>
      </View>

      {/* List of event cards*/}
      <View style={styles.eventsContainer}>
        {myEvents.map((event) => (
          <TouchableOpacity
            key={event.id}
            activeOpacity={0.85}
            onPress={() => setSelectedPanel(event)}
          >
          <View style={styles.eventCard}>
            {/* Remove button in top-right corner of each card */}
            <TouchableOpacity
              style={styles.removeButton}
              onPress={(e) => { e.stopPropagation?.(); removeFromAgenda(event.id); }}
            >
              <Text style={styles.removeButtonText}>✕</Text>
            </TouchableOpacity>

            {/* Date label */}
            <View style={styles.dateTag}>
              <Text style={styles.dateText}>{event.date}</Text>
            </View>

            <ThemedText type="title">{event.title}</ThemedText>

            {/* Session time */}
            <View style={styles.detailRow}>
              <IconSymbol
                size={18}
                name="clock.fill"
                color={Colors.awac.navy}
              />
              <ThemedText>{event.session}</ThemedText>
            </View>

            {/* Location */}
            <View style={styles.detailRow}>
              <IconSymbol
                size={18}
                name="mappin.circle.fill"
                color={Colors.awac.navy}
              />
              <ThemedText>{event.location}</ThemedText>
            </View>

            {/* Speaker */}
            <View style={styles.detailRow}>
              <IconSymbol
                size={18}
                name="person.fill"
                color={Colors.awac.navy}
              />
              <ThemedText>{event.speaker}</ThemedText>
            </View>
          </View>
        </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

// -- UI Styling -- //

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

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
import { ThemedText } from '@/components/themedText';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import PanelDetail, { Panel } from '@/app/panelDetails';

// -- TYPES -- //

// Response from supabase when selecting user_agenda
interface UserAgendaResponse {
  id: number;
  panel_id: number;
  user_id: string;
  created_at: string;
  conference_panels: Panel;
}

// -- COMPONENTS -- //

// Strips date from fetched session row
const stripDate = (session: string) => session.replace(/^\S+\s*/, '');

// Displays current user's favorited conference panels, panels fetched from user_agenda
export default function MyAgendaScreen() {
  const [myPanels, setMyPanels] = useState<Panel[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [userID, setUserID] = useState<string | undefined>();
  const [selectedPanel, setSelectedPanel] = useState<Panel | null>(null);
  const router = useRouter();

  // Load current user
  useEffect(() => {
    const loadUser = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        console.error(error);
        return;
      }
      setUserID(data.session?.user?.id);
    };
    loadUser();
  }, []);

  // -- DATA FETCHING -- //

  // Fetches agenda of authenticated user's agenda, joins user_agenda and panels tables and sorts results by session
  const fetchAgenda = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert('Error', 'Please log in to view your agenda');
        await supabase.auth.signOut();
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_agenda')
        .select(
          `
          id,
          conference_panels (
            id,
            title,
            location,
            speaker,
            date,
            session,
            tag,
            abstract,
            materials_link,
            materials_title
          )
        `,
        )
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Type assertion for the joined data
      const typedData = data as unknown as UserAgendaResponse[];

      // Sort by session label
      const panels: Panel[] =
        typedData?.map((item) => ({
          ...item.conference_panels,
        })) || [];

      panels.sort((a, b) => a.session.localeCompare(b.session)); // sort panels when added

      setMyPanels(panels);
    } catch (error) {
      console.error('Error fetching my agenda:', error);
      Alert.alert('Error', 'Failed to load your agenda');
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch every time this tab/screen becomes active
  useFocusEffect(
    useCallback(() => {
      fetchAgenda();
    }, [fetchAgenda]),
  );

  // -- DELETION -- //

  // Deletes specific panel from a user's agenda locally and in Supabase
  const removeFromAgenda = async (panelId: number) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert('Error', 'Please log in to view your agenda');
        await supabase.auth.signOut();
        return;
      }

      const { error } = await supabase
        .from('user_agenda')
        .delete()
        .eq('user_id', user.id)
        .eq('panel_id', panelId);

      if (error) throw error;

      // Re-sort panels by session after deltion
      setMyPanels((prev) =>
        prev
          .filter((e) => e.id !== panelId)
          .sort((a, b) => a.session.localeCompare(b.session)),
      );

      if (selectedPanel?.id === panelId) setSelectedPanel(null);

      Alert.alert('Success', 'Panel removed from your agenda');
    } catch (error) {
      console.error('Error removing panel:', error);
      Alert.alert('Error', 'Failed to remove panel');
    }
  };

  // -- NAVIGATION -- //

  // Go to Sessions page for browsing
  const navigateToBrowse = (): void => {
    router.push('/sessions');
  };

  // -- RENDERING -- //

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

  // Shows button to go to Sessions if user has no favorited panels
  if (myPanels.length === 0) {
    return (
      <View
        style={[styles.scrollContainer, styles.centerContent, styles.padding]}
      >
        <ThemedText style={styles.emptyText}>
          {`You haven't added any panels to your agenda yet.`}
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

  // -- UI -- //

  // Renders card for each panel, each with a remove button
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

      {/* List of panel cards*/}
      <View style={styles.panelsContainer}>
        {myPanels.map((panel) => (
          <TouchableOpacity
            key={panel.id}
            activeOpacity={0.85}
            onPress={() => setSelectedPanel(panel)}
          >
            <View style={styles.panelCard}>
              {/* Remove button in top-right corner of each card */}
              <TouchableOpacity
                style={styles.removeButton}
                onPress={(e) => {
                  e.stopPropagation?.();
                  removeFromAgenda(panel.id);
                }}
              >
                <Text style={styles.removeButtonText}>✕</Text>
              </TouchableOpacity>

              {/* Date label */}
              <View style={styles.dateTag}>
                <Text style={styles.dateText}>{panel.date}</Text>
              </View>

              <ThemedText style={{ fontSize: 19 }} type="title">
                {panel.title}
              </ThemedText>

              {/* Session time */}
              <View style={styles.detailRow}>
                <IconSymbol
                  size={18}
                  name="clock.fill"
                  color={Colors.awac.navy}
                />
                <ThemedText>{stripDate(panel.session)}</ThemedText>
              </View>

              {/* Location */}
              <View style={styles.detailRow}>
                <IconSymbol
                  size={18}
                  name="mappin.circle.fill"
                  color={Colors.awac.navy}
                />
                <ThemedText>{panel.location}</ThemedText>
              </View>

              {/* Speaker */}
              <View style={styles.detailRow}>
                <IconSymbol
                  size={18}
                  name="person.fill"
                  color={Colors.awac.navy}
                />
                <ThemedText>{panel.speaker}</ThemedText>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

// -- STYLES -- //

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
  panelsContainer: {
    padding: 20,
    paddingTop: 0,
    gap: 20,
  },
  panelCard: {
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

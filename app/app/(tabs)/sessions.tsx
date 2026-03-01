import { useMemo, useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Pressable,
  KeyboardAvoidingView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Input } from '@/components/input';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Dropdown } from 'react-native-element-dropdown';
import PanelDetail, { Panel } from '@/components/panel-details';

type SessionSlot = {
  id: string;
  label: string;
  date: string;
  session: string;
  panels: Panel[];
};

type ConferenceEventRow = {
  id: number;
  title: string;
  location: string;
  speaker: string;
  date: string;
  session: string;
  tag: string;
};

export default function SessionsScreen() {
  // Loading state for initial fetch
  const [loading, setLoading] = useState(true);

  // Fetch the logged in user's ID
  const [userID, setUserID] = useState<string | undefined>();

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

  // Grouped sessions built from conference_events
  const [sessions, setSessions] = useState<SessionSlot[]>([]);

  // ID's of events saved in user_agenda
  const [savedPanels, setSavedPanels] = useState<number[]>([]);

  // UI state
  const [search, setSearch] = useState('');
  const [sessionLabel, setSessionLabel] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [selectedPanel, setSelectedPanel] = useState<Panel | null>(null);

  // Fetch events from conference_events
  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);

      // Pull all events ordered by date + session
      const { data, error } = await supabase
        .from('conference_events')
        .select('id,title,location,speaker,date,session,tag')
        .order('date', { ascending: true })
        .order('session', { ascending: true });

      if (error) throw error;

      const rows = (data ?? []) as ConferenceEventRow[];

      // Group events by session
      const grouped = new Map<
        string,
        { date: string; session: string; panels: Panel[] }
      >();

      rows.forEach((r) => {
        const key = r.session;

        // Create new session bucket if needed
        if (!grouped.has(key)) {
          grouped.set(key, { date: r.date, session: r.session, panels: [] });
        }

        // Push event into its session
        grouped.get(key)!.panels.push({
          id: r.id,
          title: r.title,
          date: r.date,
          session: r.session,
          tag: r.tag,
          location: r.location,
          speaker: r.speaker,
        });
      });

      // Convert grouped sessions into SessionSlot list
      const built: SessionSlot[] = Array.from(grouped.entries()).map(
        ([key, value]) => ({
          id: key,
          label: key,
          date: value.date,
          session: value.session,
          panels: value.panels,
        }),
      );

      setSessions(built);
    } catch (err) {
      console.error(err);
      Alert.alert('Error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch saved events for current user
  const fetchSavedPanels = useCallback(async () => {
    if (!userID) {
      setSavedPanels([]);
      return;
    }

    const { data, error } = await supabase
      .from('user_agenda')
      .select('event_id')
      .eq('user_id', userID);

    if (error) {
      console.error(error);
      return;
    }

    setSavedPanels((data ?? []).map((r) => r.event_id));
  }, [userID]);

  useEffect(() => {
    fetchSessions();
    fetchSavedPanels();
  }, [fetchSessions, fetchSavedPanels]);

  useFocusEffect(
    useCallback(() => {
      // Runs every time this tab/screen becomes active
      fetchSessions();
      fetchSavedPanels();
    }, [fetchSessions, fetchSavedPanels]),
  );

  // Add event to user_agenda
  const addToAgenda = async (eventId: number) => {
    const { error } = await supabase
      .from('user_agenda')
      .insert({ user_id: userID, event_id: eventId });
    if (error) throw error;
  };

  // Remove event from user_agenda
  const removeFromAgenda = async (eventId: number) => {
    if (!userID) return;

    const { error } = await supabase
      .from('user_agenda')
      .delete()
      .eq('user_id', userID)
      .eq('event_id', eventId);

    if (error) throw error;
  };

  // Toggle heart save/unsave
  const toggleSavePanel = async (panelId: number) => {
    if (!userID) {
      Alert.alert('Sign in required');
      return;
    }

    const isSaved = savedPanels.includes(panelId);

    // UI update
    setSavedPanels((prev) =>
      isSaved ? prev.filter((id) => id !== panelId) : [...prev, panelId],
    );

    try {
      if (isSaved) await removeFromAgenda(panelId);
      else await addToAgenda(panelId);
    } catch (err) {
      console.error(err);

      // Rollback UI on failure
      setSavedPanels((prev) =>
        isSaved ? [...prev, panelId] : prev.filter((id) => id !== panelId),
      );

      Alert.alert(
        'Error',
        isSaved ? 'Failed to remove event' : 'Failed to save event',
      );
    }
  };

  // Dropdown options
  const sessionOptions = useMemo(
    () => [
      { label: 'All Sessions', value: 'ALL' },
      ...sessions.map((s) => ({ label: s.label, value: s.label })),
    ],
    [sessions],
  );

  const topicOptions = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach((s) => s.panels.forEach((p) => p.tag && set.add(p.tag)));
    return [
      { label: 'All Topics', value: 'ALL' },
      ...Array.from(set).map((t) => ({ label: t, value: t })),
    ];
  }, [sessions]);

  // Search + session + tag filters
  const filteredSessions = useMemo(() => {
    const q = search.trim().toLowerCase();

    const visible =
      sessionLabel && sessionLabel !== 'ALL'
        ? sessions.filter((s) => s.label === sessionLabel)
        : sessions;

    return visible
      .map((slot) => {
        const panels = slot.panels.filter((p) => {
          const matchesSearch =
            !q ||
            p.title.toLowerCase().includes(q) ||
            p.speaker.toLowerCase().includes(q) ||
            p.location.toLowerCase().includes(q) ||
            p.tag.toLowerCase().includes(q) ||
            p.session.toLowerCase().includes(q);

          const matchesTag =
            tagFilter && tagFilter !== 'ALL' ? p.tag === tagFilter : true;

          return matchesSearch && matchesTag;
        });

        return { ...slot, panels };
      })
      .filter((slot) => slot.panels.length > 0);
  }, [sessions, search, sessionLabel, tagFilter]);

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.awac.beige }}>
        <View style={[styles.scrollContainer, styles.centerContent]}>
          <ActivityIndicator size="large" color={Colors.awac.navy} />
        </View>
      </SafeAreaView>
    );
  }

  // Panel detail view — shared component
  if (selectedPanel) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.awac.beige }}>
        <PanelDetail
          panel={selectedPanel}
          userID={userID}
          onBack={() => setSelectedPanel(null)}
        />
      </SafeAreaView>
    );
  }

  // Main UI
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.awac.beige }}>
      <ScrollView
        style={styles.scrollContainer}
        keyboardShouldPersistTaps="always"
      >
        <View style={styles.container}>
          <Input
            text="Search events..."
            value={search}
            onChangeText={setSearch}
          />

          {/* Dropdown for sessions */}
          <ThemedView style={styles.dropdownWrap}>
            <ThemedText style={styles.dropdownLabel}>Session</ThemedText>
            <Dropdown
              style={styles.dropdown}
              data={sessionOptions}
              labelField="label"
              valueField="value"
              value={sessionLabel ?? 'ALL'}
              placeholder="Select session"
              onChange={(item) =>
                setSessionLabel(item.value === 'ALL' ? null : item.value)
              }
            />
          </ThemedView>

          {/* Dropdown for topics */}
          <ThemedView style={styles.dropdownWrap}>
            <ThemedText style={styles.dropdownLabel}>Topic</ThemedText>
            <Dropdown
              style={styles.dropdown}
              data={topicOptions}
              labelField="label"
              valueField="value"
              value={tagFilter ?? 'ALL'}
              placeholder="Select topic"
              onChange={(item) =>
                setTagFilter(item.value === 'ALL' ? null : item.value)
              }
            />
          </ThemedView>

          {filteredSessions.map((slot) => (
            <View key={slot.id}>
              <ThemedText style={{ fontWeight: '700' }}>
                {slot.label}
              </ThemedText>

              {slot.panels.map((panel) => (
                <TouchableOpacity
                  key={panel.id}
                  activeOpacity={0.85}
                  onPress={() => setSelectedPanel(panel)}
                >
                  <ThemedView style={styles.sessionCardDetails}>
                    <Pressable
                      style={styles.heartButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        toggleSavePanel(panel.id);
                      }}
                      hitSlop={12}
                    >
                      <Ionicons
                        name={
                          savedPanels.includes(panel.id)
                            ? 'heart'
                            : 'heart-outline'
                        }
                        size={32}
                        color={savedPanels.includes(panel.id) ? 'red' : '#888'}
                      />
                    </Pressable>

                    <ThemedText type="title">{panel.title}</ThemedText>

                    <View style={styles.detailRow}>
                      <IconSymbol
                        size={18}
                        name="mappin.circle.fill"
                        color={Colors.awac.navy}
                      />
                      <ThemedText>{panel.location}</ThemedText>
                    </View>

                    <View style={styles.detailRow}>
                      <IconSymbol
                        size={18}
                        name="person.fill"
                        color={Colors.awac.navy}
                      />
                      <ThemedText>{panel.speaker}</ThemedText>
                    </View>
                  </ThemedView>
                </TouchableOpacity>
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flex: 1, backgroundColor: Colors.awac.beige },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  container: { padding: 20, gap: 20 },

  dropdownWrap: {
    width: '20%',
    borderWidth: 1,
    borderColor: Colors.awac.navy,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.lightestBlue,
  },
  dropdownLabel: {
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingTop: 10,
    color: Colors.awac.navy,
  },
  dropdown: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  sessionCardDetails: {
    padding: 15,
    borderWidth: 2,
    borderColor: Colors.awac.navy,
    borderRadius: 12,
    marginTop: 10,
    position: 'relative',
    backgroundColor: Colors.lightestBlue,
  },
  heartButton: { position: 'absolute', top: 10, right: 15, zIndex: 10 },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

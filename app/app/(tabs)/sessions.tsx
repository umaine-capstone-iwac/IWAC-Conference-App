import { useMemo, useState, useEffect, useCallback } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Pressable,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themedText';
import { ThemedView } from '@/components/themedView';
import { Input } from '@/components/input';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { Ionicons } from '@expo/vector-icons';
import { Dropdown } from 'react-native-element-dropdown';
import PanelDetail, { Panel } from '@/app/panelDetails';
import { useLocalSearchParams, useRouter } from 'expo-router';

// -- TYPES -- //

type SessionSlot = {
  id: string;
  label: string;
  date: string;
  session: string;
  panels: Panel[];
};

type ConferencePanelRow = {
  id: number;
  title: string;
  location: string;
  speaker: string;
  date: string;
  session: string;
  tag: string[] | string | null;
  abstract: string | null;
  materials_title: string | null;
  materials_link: string | null;
};

// Strips date from fetched session row
const stripDate = (session: string) => session.replace(/^\S+\s*/, '');

const normalizeTags = (tag: string[] | string | null | undefined) => {
  if (Array.isArray(tag)) return tag;

  if (!tag) return [];

  const trimmed = tag.trim();

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed
      .slice(1, -1)
      .split(',')
      .map((t) => t.trim().replace(/^"(.*)"$/, '$1'))
      .filter(Boolean);
  }

  return [trimmed];
};

export default function SessionsScreen() {
  // -- ROUTING -- //

  const router = useRouter();
  const params = useLocalSearchParams();

  // Session filter persistence
  const sessionLabel =
    typeof params.session === 'string' ? params.session : null;

  // Tag filter persistence
  const tagFilter = typeof params.topic === 'string' ? params.topic : null;

  // -- STATE -- //

  // Loading state for initial fetch
  const [loading, setLoading] = useState(true);

  // Fetch the logged in user's ID
  const [userID, setUserID] = useState<string | undefined>();

  // Grouped sessions built from conference_panels
  const [sessions, setSessions] = useState<SessionSlot[]>([]);

  // ID's of panels saved in user_agenda
  const [savedPanels, setSavedPanels] = useState<number[]>([]);

  // UI state
  const [search, setSearch] = useState('');
  const [selectedPanel, setSelectedPanel] = useState<Panel | null>(null);

  // -- AUTH INITIALIZATION -- //
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

  // Fetch panels from conference_panels
  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);

      // Pull all panels ordered by date + session
      const { data, error } = await supabase
        .from('conference_panels')
        .select(
          'id,title,location,speaker,date,session,tag,abstract,materials_title,materials_link',
        )
        .order('date', { ascending: true })
        .order('session', { ascending: true });

      if (error) throw error;

      const rows = (data ?? []) as ConferencePanelRow[];

      // Group panels by session
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

        // Push panel into its session
        grouped.get(key)!.panels.push({
          id: r.id,
          title: r.title,
          date: r.date,
          session: r.session,
          tag: normalizeTags(r.tag),
          location: r.location,
          speaker: r.speaker,
          abstract: r.abstract,
          materials_title: r.materials_title,
          materials_link: r.materials_link,
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

      built.sort((a, b) => {
        const getDay = (d: string) =>
          parseInt(d.trim().split(' ').pop() || '0', 10);

        return getDay(a.date) - getDay(b.date);
      });

      setSessions(built);
    } catch (err) {
      console.error(err);
      Alert.alert('Error');
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch saved panels for current user
  const fetchSavedPanels = useCallback(async () => {
    if (!userID) {
      setSavedPanels([]);
      return;
    }

    const { data, error } = await supabase
      .from('user_agenda')
      .select('panel_id')
      .eq('user_id', userID);

    if (error) {
      console.error(error);
      return;
    }

    setSavedPanels((data ?? []).map((r) => r.panel_id));
  }, [userID]);

  // -- SCREEN EFFECTS -- //

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

  // -- ACTIONS -- //

  // Add panel to user_agenda
  const addToAgenda = async (panelId: number) => {
    const { error } = await supabase
      .from('user_agenda')
      .insert({ user_id: userID, panel_id: panelId });
    if (error) throw error;
  };

  // Remove panel from user_agenda
  const removeFromAgenda = async (panelId: number) => {
    if (!userID) return;

    const { error } = await supabase
      .from('user_agenda')
      .delete()
      .eq('user_id', userID)
      .eq('panel_id', panelId);

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
        isSaved ? 'Failed to remove panel' : 'Failed to save panel',
      );
    }
  };

  // -- FILTERING -- //

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
    sessions.forEach((s) =>
      s.panels.forEach((p) =>
        normalizeTags(p.tag).forEach((tag) => set.add(tag)),
      ),
    );
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
          const tags = normalizeTags(p.tag);

          const matchesSearch =
            !q ||
            p.title.toLowerCase().includes(q) ||
            p.speaker.toLowerCase().includes(q) ||
            p.location.toLowerCase().includes(q) ||
            tags.some((tag) => tag.toLowerCase().includes(q)) ||
            p.session.toLowerCase().includes(q);

          const matchesTag =
            tagFilter && tagFilter !== 'ALL' ? tags.includes(tagFilter) : true;

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
      <PanelDetail
        panel={selectedPanel}
        userID={userID}
        onBack={() => setSelectedPanel(null)}
      />
    );
  }

  // -- UI -- //

  return (
    <ScrollView
      style={styles.scrollContainer}
      keyboardShouldPersistTaps="always"
    >
      <View style={styles.container}>
        <Input
          text="Search panels..."
          value={search}
          onChangeText={setSearch}
        />

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
              router.setParams({
                session: item.value === 'ALL' ? undefined : item.value,
              })
            }
          />
        </ThemedView>

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
              router.setParams({
                topic: item.value === 'ALL' ? undefined : item.value,
              })
            }
          />
        </ThemedView>

        {filteredSessions.map((slot) => (
          <View key={slot.id}>
            <ThemedText style={{ fontWeight: '700' }}>{slot.label}</ThemedText>

            {slot.panels.map((panel) => (
              <TouchableOpacity
                key={panel.id}
                activeOpacity={0.85}
                onPress={() =>
                  setSelectedPanel({ ...panel, tag: normalizeTags(panel.tag) })
                }
              >
                <ThemedView style={styles.sessionCardDetails}>
                  <View style={styles.cardHeader}>
                    <ThemedText style={styles.panelTitle} type="title">
                      {panel.title}
                    </ThemedText>

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
                  </View>

                  <View style={styles.detailRow}>
                    <IconSymbol
                      size={18}
                      name="clock.fill"
                      color={Colors.awac.navy}
                    />
                    <ThemedText>{stripDate(panel.session)}</ThemedText>
                  </View>

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
  );
}

// -- STYLES -- //

const styles = StyleSheet.create({
  scrollContainer: { flex: 1, backgroundColor: Colors.awac.beige },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  container: { padding: 20, gap: 20 },

  dropdownWrap: {
    width: '100%',
    borderWidth: 1,
    borderColor: Colors.awac.navy,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.lightestBlue,
  },
  dropdownLabel: {
    fontWeight: '700',
    paddingHorizontal: 12,
    paddingTop: 5,
    color: Colors.awac.navy,
  },
  dropdown: {
    paddingHorizontal: 12,
    paddingVertical: 5,
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
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.awac.navy,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 8,
  },
  panelTitle: {
    fontSize: 19,
    flex: 1,
    paddingRight: 8,
  },
  heartButton: {
    paddingTop: 2,
    flexShrink: 0,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

import { useMemo, useState, useEffect, useCallback } from "react";
import { ScrollView, StyleSheet, View, Text, TouchableOpacity, ActivityIndicator, Alert, Pressable, Linking, Image } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Input } from "@/components/input";
import { Colors } from "@/constants/theme";
import { supabase } from "@/lib/supabase";
import { Ionicons } from "@expo/vector-icons";


type Panel = {
  id: number;
  title: string;
  location: string;
  speaker: string;
  date: string;
  session: string;
  tag: string;
};

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

type PanelResource = {
  id: number;
  created_at: string;
  event_id: number;
  type: string | null;
  title: string | null;
  url: string;
};

export default function SessionsScreen() {
  //loading state for initial fetch
  const [loading, setLoading] = useState(true);

  //fetch the logged in user's ID
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

  //grouped sessions built from conference_events
  const [sessions, setSessions] = useState<SessionSlot[]>([]);

  //ids of events saved in user_agenda
  const [savedPanels, setSavedPanels] = useState<number[]>([]);

  //UI state
  const [search, setSearch] = useState("");
  const [sessionLabel, setSessionLabel] = useState<string | null>(null);
  const [tagFilter, setTagFilter] = useState<string | null>(null);
  const [selectedPanel, setSelectedPanel] = useState<Panel | null>(null);

  //comments state
  const [comments, setComments] = useState<{ comment_id: string; user_id: string; comment_content: string; created_at: string }[]>([]);
  const [newComment, setNewComment] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  //resource state
  const [resources, setResources] = useState<PanelResource[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(false);

  const isPdfUrl = (url: string) => /\.pdf(\?|#|$)/i.test(url);

  const getYouTubeId = (url: string) => {
    try {
      const u = new URL(url);

      //youtu.be/<id>
      if (u.hostname === "youtu.be") {
        return u.pathname.split("/")[1] || null;
      }

      //youtube.com/watch?v=<id>
      if ((u.hostname === "youtube.com" || u.hostname === "www.youtube.com") && u.pathname === "/watch") {
        return u.searchParams.get("v");
      }

      return null;
    } catch {
      return null;
    }
  };

  const openUrl = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert("Can't open link");
        return;
      }
      await Linking.openURL(url);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to open link");
    }
  };

  const downloadPdf = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert("Can't download file");
        return;
      }
      await Linking.openURL(url);
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Failed to download PDF");
    }
  };

  //fetch events from conference_events
  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);

      //pull all events ordered by date + session
      const { data, error } = await supabase
        .from("conference_events")
        .select("id,title,location,speaker,date,session,tag")
        .order("date", { ascending: true })
        .order("session", { ascending: true });

      if (error) throw error;

      const rows = (data ?? []) as ConferenceEventRow[];

      //group events by session
      const grouped = new Map<string, { date: string; session: string; panels: Panel[] }>();

      rows.forEach((r) => {
        const key = r.session;

        //create new session bucket if needed
        if (!grouped.has(key)) {
          grouped.set(key, { date: r.date, session: r.session, panels: [] });
        }

        //push event into its session
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

      //convert grouped sessions into SessionSlot list
      const built: SessionSlot[] = Array.from(grouped.entries()).map(([key, value]) => ({
        id: key,
        label: key, //show the session string
        date: value.date,
        session: value.session,
        panels: value.panels,
      }));

      setSessions(built);
    } catch (err) {
      console.error(err);
      Alert.alert("Error");
    } finally {
      setLoading(false);
    }
  }, []);

  //fetch saved events for current user
  const fetchSavedPanels = useCallback(async () => {
    if (!userID) {
      setSavedPanels([]);
      return;
    }

    const { data, error } = await supabase.from("user_agenda").select("event_id").eq("user_id", userID);

    if (error) {
      console.error(error);
      return;
    }

    setSavedPanels((data ?? []).map((r: any) => r.event_id));
  }, [userID]);

useEffect(() => {
  fetchSessions();
  fetchSavedPanels();
}, []);

useFocusEffect(
  useCallback(() => { // runs every time this tab/screen becomes active
    fetchSessions();
    fetchSavedPanels();
  }, [fetchSessions, fetchSavedPanels])
);

  //add event to user_agenda
  const addToAgenda = async (eventId: number) => {
    const { error } = await supabase.from("user_agenda").insert({ user_id: userID, event_id: eventId });
    if (error) throw error;
  };

  //remove event from user_agenda
  const removeFromAgenda = async (eventId: number) => {
    if (!userID) return;

    const { error } = await supabase.from("user_agenda").delete().eq("user_id", userID).eq("event_id", eventId);

    if (error) throw error;
  };

  //toggle heart save/unsave
  const toggleSavePanel = async (panelId: number) => {
    if (!userID) {
      Alert.alert("Sign in required");
      return;
    }

    const isSaved = savedPanels.includes(panelId);

    //UI update
    setSavedPanels((prev) => (isSaved ? prev.filter((id) => id !== panelId) : [...prev, panelId]));

    try {
      if (isSaved) await removeFromAgenda(panelId);
      else await addToAgenda(panelId);
    } catch (err) {
      console.error(err);

      //rollback UI on failure
      setSavedPanels((prev) => (isSaved ? [...prev, panelId] : prev.filter((id) => id !== panelId)));

      Alert.alert("Error", isSaved ? "Failed to remove event" : "Failed to save event");
    }
  };

  const fetchComments = useCallback(async (eventId: number) => {
    //fetch comments of panel
    setCommentsLoading(true);
    const { data, error } = await supabase
      .from("panel_comments")
      .select("comment_id, user_id, comment_content, created_at")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true });

    if (error) console.error(error);
    else setComments(data ?? []);
    setCommentsLoading(false);
  }, []);

  const fetchResources = useCallback(async (eventId: number) => {
    //fetch resources of panel
    setResourcesLoading(true);

    const { data, error } = await supabase
      .from("panel_resources")
      .select("id, created_at, event_id, type, title, url")
      .eq("event_id", eventId)
      .order("created_at", { ascending: true });

    if (error) console.error(error);
    else setResources((data ?? []) as PanelResource[]);

    setResourcesLoading(false);
  }, []);

  const openPanel = (panel: Panel) => {
    setSelectedPanel(panel);
    setComments([]);
    setNewComment("");
    setResources([]);
    fetchResources(panel.id);
    fetchComments(panel.id);
  };

  const submitComment = async () => { //add comment to table with user/event ID
    if (!userID) { Alert.alert("Sign in required"); return;
    }
    if (!newComment.trim()) return;
    if (!selectedPanel) return;

    setSubmitting(true);
    const { error } = await supabase.from("panel_comments").insert({
      user_id: userID,
      event_id: selectedPanel.id,
      comment_content: newComment.trim(),
    });

    if (error) {
      console.error(error);
      Alert.alert("Error", "Failed to post comment");
    } else {
      setNewComment("");
      await fetchComments(selectedPanel.id); // refresh list of comments
    }
    setSubmitting(false);
  };

  //build list of session tags
  const sessionTags = useMemo(() => sessions.map((s) => s.label), [sessions]);

  //build list of tags
  const tagTags = useMemo(() => {
    const set = new Set<string>();
    sessions.forEach((s) => s.panels.forEach((p) => p.tag && set.add(p.tag)));
    return Array.from(set);
  }, [sessions]);

  //apply search + session + tag filters
  const filteredSessions = useMemo(() => {
    const q = search.trim().toLowerCase();

    const visible = sessionLabel ? sessions.filter((s) => s.label === sessionLabel) : sessions;

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

          const matchesTag = tagFilter ? p.tag === tagFilter : true;

          return matchesSearch && matchesTag;
        });

        return { ...slot, panels };
      })
      .filter((slot) => slot.panels.length > 0);
  }, [sessions, search, sessionLabel, tagFilter]);

  //loading state
  if (loading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: Colors.awac.beige }}>
        <View style={[styles.scrollContainer, styles.centerContent]}>
          <ActivityIndicator size="large" color={Colors.awac.navy} />
        </View>
      </SafeAreaView>
    );
  }

  //main UI
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.awac.beige }}>
      {/* panel detail view */}
      {selectedPanel ? (
        <ScrollView style={styles.scrollContainer} keyboardShouldPersistTaps="always">
          <View style={styles.container}>
            {/* back button */}
            <TouchableOpacity onPress={() => setSelectedPanel(null)}>
              <Text style={{ fontSize: 18, color: Colors.awac.navy }}>← Back</Text>
            </TouchableOpacity>

            <ThemedText type="title">{selectedPanel.title}</ThemedText>

            <ThemedView style={styles.sessionCardDetails}>
              <Pressable style={styles.heartButton} onPress={() => toggleSavePanel(selectedPanel.id)} hitSlop={12}>
                <Ionicons
                  name={savedPanels.includes(selectedPanel.id) ? "heart" : "heart-outline"}
                  size={32}
                  color={savedPanels.includes(selectedPanel.id) ? "red" : "#888"}
                  />
              </Pressable>

              <ThemedText>{selectedPanel.date}</ThemedText>
              <ThemedText>{selectedPanel.session}</ThemedText>
              <ThemedText>{selectedPanel.tag}</ThemedText>
              <ThemedText>{selectedPanel.location}</ThemedText>
              <ThemedText>{selectedPanel.speaker}</ThemedText>
            </ThemedView>

            {/* resources section */}
            <ThemedText style={{ fontWeight: "700", fontSize: 16, marginTop: 10 }}>Resources</ThemedText>
            {resourcesLoading ? (
              <ActivityIndicator size="small" color={Colors.awac.navy} />
            ) : resources.length === 0 ? (
              <ThemedText style={{ color: "#888" }}>No resources yet</ThemedText>
            ) : (
              resources.map((r) => {
                const url = r.url;
                const title = r.title?.trim() || url;

                const isPdf = r.type?.toLowerCase() === "pdf" || isPdfUrl(url);
                const ytId = r.type?.toLowerCase() === "youtube" ? getYouTubeId(url) : null;

                if (isPdf) {
                  return (
                    <ThemedView
                      key={r.id}
                      style={{
                        padding: 12,
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: Colors.awac.navy,
                        backgroundColor: Colors.lightestBlue,
                        marginTop: 8,
                      }}
                    >
                      <ThemedText style={{ fontWeight: "600", marginBottom: 6 }}>📄 {title}</ThemedText>

                      <TouchableOpacity
                        onPress={() => downloadPdf(url)}
                        style={{
                          backgroundColor: Colors.awac.navy,
                          paddingVertical: 10,
                          paddingHorizontal: 14,
                          borderRadius: 8,
                          alignSelf: "flex-start",
                        }}
                      >
                        <Text style={{ color: "#fff", fontWeight: "600" }}>Download PDF</Text>
                      </TouchableOpacity>
                    </ThemedView>
                  );
                }

                if (ytId) {
                  const thumb = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
                  return (
                    <TouchableOpacity key={r.id} activeOpacity={0.85} onPress={() => openUrl(url)}>
                      <ThemedView
                        style={{
                          padding: 12,
                          borderRadius: 10,
                          borderWidth: 1,
                          borderColor: Colors.awac.navy,
                          backgroundColor: Colors.lightestBlue,
                          marginTop: 8,
                          gap: 8,
                        }}
                      >
                        <ThemedText style={{ fontWeight: "600" }}>▶️ {title}</ThemedText>
                        <Image source={{ uri: thumb }} style={{ width: "100%", height: 180, borderRadius: 8 }} resizeMode="cover" />
                        <ThemedText style={{ color: Colors.awac.navy }}>Open YouTube</ThemedText>
                      </ThemedView>
                    </TouchableOpacity>
                  );
                }

                return null;
              })
            )}

            {/* Comment Section */}
            <ThemedText style={{ fontWeight: "700", fontSize: 16, marginTop: 10 }}>Comments</ThemedText>
            {commentsLoading ? (
              <ActivityIndicator size="small" color={Colors.awac.navy} />
            ) : comments.length === 0 ? (
              <ThemedText style={{ color: "#888" }}>No comments yet</ThemedText>
            ) : (
              comments.map((c) => (
                <ThemedView
                  key={c.comment_id}
                  style={{
                    padding: 12,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: Colors.awac.navy,
                    backgroundColor: Colors.lightestBlue,
                    marginTop: 8,
                  }}
                >
                  <ThemedText style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>
                    {new Date(c.created_at).toLocaleString()}
                  </ThemedText>
                  <ThemedText>{c.comment_content}</ThemedText>
                </ThemedView>
              ))
            )}
            {/* Comment Input */}
            <View style={{ flexDirection: "row", gap: 10, alignItems: "center", marginTop: 12 }}>
              <Input
                text="Add a comment..."
                value={newComment}
                onChangeText={setNewComment}
                style={{ flex: 1 }}
              />
              <TouchableOpacity
                onPress={submitComment}
                disabled={submitting || !newComment.trim()}
                style={{
                  backgroundColor: Colors.awac.navy,
                  paddingVertical: 10,
                  paddingHorizontal: 16,
                  borderRadius: 10,
                  opacity: submitting || !newComment.trim() ? 0.5 : 1,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "600" }}>Post</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      ) : (
        <ScrollView style={styles.scrollContainer} keyboardShouldPersistTaps="always">
          <View style={styles.container}>
            <Input text="Search events..." value={search} onChangeText={setSearch} />

            {/* session tag filters */}
            <View style={styles.tagRow}>
              {sessionTags.map((label) => (
                <TouchableOpacity
                  key={label}
                  style={[styles.tagButton, sessionLabel === label && styles.tagButtonActive]}
                  onPress={() => setSessionLabel((prev) => (prev === label ? null : label))}
                >
                  <Text style={sessionLabel === label ? styles.tagTextActive : styles.tagText}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* topic/tag filters */}
            <View style={styles.tagRow}>
              {tagTags.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.tagButton, tagFilter === t && styles.tagButtonActive]}
                  onPress={() => setTagFilter((prev) => (prev === t ? null : t))}
                >
                  <Text style={tagFilter === t ? styles.tagTextActive : styles.tagText}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {filteredSessions.map((slot) => (
              <View key={slot.id}>
                <ThemedText style={{ fontWeight: "700" }}>{slot.label}</ThemedText>

                {slot.panels.map((panel) => (
                  <TouchableOpacity key={panel.id} activeOpacity={0.85} onPress={() => openPanel(panel)}>
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
                          name={savedPanels.includes(panel.id) ? "heart" : "heart-outline"}
                          size={32}
                          color={savedPanels.includes(panel.id) ? "red" : "#888"}
                          />
                      </Pressable>
                      <ThemedText type="title">{panel.title}</ThemedText>
                      <ThemedText>{panel.tag}</ThemedText>
                      <ThemedText>{panel.location}</ThemedText>
                      <ThemedText>{panel.speaker}</ThemedText>
                    </ThemedView>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { flex: 1, backgroundColor: Colors.awac.beige },
  centerContent: { justifyContent: "center", alignItems: "center" },
  container: { padding: 20, gap: 20 },
  tagRow: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  tagButton: { padding: 8, backgroundColor: "#e1e1e1", borderRadius: 12 },
  tagButtonActive: { backgroundColor: Colors.awac.navy },
  tagText: { fontWeight: "600", color: "#333" },
  tagTextActive: { color: "#fff", fontWeight: "600" },
  sessionCardDetails: {
    padding: 15,
    borderWidth: 2,
    borderColor: Colors.awac.navy,
    borderRadius: 12,
    marginTop: 10,
    position: "relative",
    backgroundColor: Colors.lightestBlue,
  },
  heartButton: { position: "absolute", top: 10, right: 15, zIndex: 10 },
});

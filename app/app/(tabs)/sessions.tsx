import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Input } from "@/components/input";
import { Colors } from "@/constants/theme";

type Panel = {
  id: number;
  category: string;
  title: string;
  location: string;
  speaker: string;
  description: string;
};

type SessionSlot = {
  id: number;
  label: string;
  date: string;
  time: string;
  panels: Panel[];
};

//temporary sessions
export default function SessionsScreen() {
  const allSessions = useMemo<SessionSlot[]>(
    () => [
      {
        id: 101,
        label: "Session A",
        date: "Mar 14",
        time: "9:00 AM - 10:30 AM",
        panels: [
          {
            id: 1,
            category: "AI/ML",
            title: "AI Research",
            location: "Foster Center for Innovation",
            speaker: "Professor Dufour",
            description: "An introduction to AI research and applications.",
          },
          {
            id: 2,
            category: "Cloud",
            title: "Cloud Systems Primer",
            location: "Neville Hall",
            speaker: "Professor Yu",
            description: "A guided overview of modern cloud architecture.",
          },
        ],
      },
      {
        id: 102,
        label: "Session B",
        date: "Mar 14",
        time: "11:00 AM - 12:30 PM",
        panels: [
          {
            id: 3,
            category: "Cloud",
            title: "Cloud Systems Workshop",
            location: "Neville Hall",
            speaker: "Professor Yu",
            description: "A workshop exploring cloud architecture and distributed systems.",
          },
          {
            id: 4,
            category: "DevOps",
            title: "CI/CD in Practice",
            location: "Boardman Hall",
            speaker: "Professor Dickens",
            description: "Modern pipelines, automation, and deployment strategies.",
          },
        ],
      },
      {
        id: 103,
        label: "Session C",
        date: "Mar 14",
        time: "2:00 PM - 3:30 PM",
        panels: [
          {
            id: 5,
            category: "DevOps",
            title: "DevOps Best Practices",
            location: "Boardman Hall",
            speaker: "Professor Dickens",
            description: "A talk on CI/CD pipelines and modern DevOps strategies.",
          },
        ],
      },
    ],
    []
  );

  const sessionTags = useMemo(() => allSessions.map((s) => s.label), [allSessions]);
  const categoryTags = useMemo(() => ["AI/ML", "Cloud", "DevOps"], []);

  const [search, setSearch] = useState("");
  const [sessionLabel, setSessionLabel] = useState<string | null>(null);
  const [categoryTag, setCategoryTag] = useState<string | null>(null);
  const [savedPanels, setSavedPanels] = useState<number[]>([]);
  const [selectedPanel, setSelectedPanel] = useState<Panel | null>(null);

  const toggleSavePanel = (panelId: number) => {
    setSavedPanels((prev) => (prev.includes(panelId) ? prev.filter((x) => x !== panelId) : [...prev, panelId]));
  };

  const filteredSessions = useMemo(() => {
    const q = search.trim().toLowerCase();

    const visibleSessions = sessionLabel ? allSessions.filter((s) => s.label === sessionLabel) : allSessions;

    return visibleSessions
      .map((slot) => {
        const panels = slot.panels.filter((p) => {
          const matchesSearch =
            !q ||
            p.title.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            p.speaker.toLowerCase().includes(q) ||
            p.location.toLowerCase().includes(q);

          const matchesCategory = categoryTag ? p.category === categoryTag : true;

          return matchesSearch && matchesCategory;
        });

        return { ...slot, panels };
      })
      .filter((slot) => slot.panels.length > 0);
  }, [allSessions, search, sessionLabel, categoryTag]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.awac.beige }}>
      {selectedPanel ? (
        <ScrollView style={styles.scrollContainer} keyboardShouldPersistTaps="always">
          <View style={styles.container}>
            <TouchableOpacity onPress={() => setSelectedPanel(null)} activeOpacity={0.7}>
              <Text style={{ fontSize: 18, color: Colors.awac.navy, marginBottom: 10 }}>← Back</Text>
            </TouchableOpacity>

            <ThemedText type="title" style={styles.headerText}>
              {selectedPanel.title}
            </ThemedText>

            <ThemedView style={styles.sessionCard}>
              <TouchableOpacity
                style={styles.heartButton}
                onPress={() => toggleSavePanel(selectedPanel.id)}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 40, color: savedPanels.includes(selectedPanel.id) ? "red" : "#888" }}>♥</Text>
              </TouchableOpacity>

              <View style={styles.categoryTag}>
                <Text style={styles.categoryText}>{selectedPanel.category}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Location:</Text>
                <ThemedText>{selectedPanel.location}</ThemedText>
              </View>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Speaker:</Text>
                <ThemedText>{selectedPanel.speaker}</ThemedText>
              </View>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Description:</Text>
                <ThemedText>{selectedPanel.description}</ThemedText>
              </View>
            </ThemedView>
          </View>
        </ScrollView>
      ) : (
        <ScrollView style={styles.scrollContainer} keyboardShouldPersistTaps="always">
          <View style={styles.container}>
            <Input text="Search panels..." value={search} onChangeText={setSearch} style={styles.searchBar} />

            <View style={styles.tagRow}>
              {sessionTags.map((label) => (
                <TouchableOpacity
                  key={label}
                  activeOpacity={0.7}
                  style={[styles.tagButton, sessionLabel === label && styles.tagButtonActive]}
                  onPress={() => setSessionLabel((prev) => (prev === label ? null : label))}
                >
                  <Text style={sessionLabel === label ? styles.tagTextActive : styles.tagText}>{label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.tagRow}>
              {categoryTags.map((t) => (
                <TouchableOpacity
                  key={t}
                  activeOpacity={0.7}
                  style={[styles.tagButton, categoryTag === t && styles.tagButtonActive]}
                  onPress={() => setCategoryTag((prev) => (prev === t ? null : t))}
                >
                  <Text style={categoryTag === t ? styles.tagTextActive : styles.tagText}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <ThemedText type="title" style={styles.headerText}>
              Agenda
            </ThemedText>

            {filteredSessions.length === 0 ? (
              <ThemedText>No panels match your filters.</ThemedText>
            ) : (
              filteredSessions.map((slot) => (
                <View key={slot.id} style={{ gap: 10 }}>
                  <ThemedText style={{ fontSize: 18, fontWeight: "700", color: Colors.awac.navy }}>
                    {slot.label} • {slot.date} • {slot.time}
                  </ThemedText>

                  {slot.panels.map((panel) => (
                    <TouchableOpacity key={panel.id} activeOpacity={0.85} onPress={() => setSelectedPanel(panel)}>
                      <ThemedView style={styles.sessionCardDetails}>
                        <TouchableOpacity
                          style={styles.heartButton}
                          onPress={() => toggleSavePanel(panel.id)}
                          activeOpacity={0.7}
                        >
                          <Text style={{ fontSize: 40, color: savedPanels.includes(panel.id) ? "red" : "#888" }}>♥</Text>
                        </TouchableOpacity>

                        <ThemedText type="title" style={styles.sessionTitle}>
                          {panel.title}
                        </ThemedText>

                        <View style={styles.categoryTag}>
                          <Text style={styles.categoryText}>{panel.category}</Text>
                        </View>

                        <View style={styles.row}>
                          <Text style={styles.rowLabel}>Location:</Text>
                          <ThemedText>{panel.location}</ThemedText>
                        </View>

                        <View style={styles.row}>
                          <Text style={styles.rowLabel}>Speaker:</Text>
                          <ThemedText>{panel.speaker}</ThemedText>
                        </View>
                      </ThemedView>
                    </TouchableOpacity>
                  ))}
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  scrollContainer: { backgroundColor: Colors.awac.beige },
  container: { flexDirection: "column", gap: 25, padding: 20 },

  searchBar: { height: 50, fontSize: 16 },

  tagRow: { flexDirection: "row", gap: 10, marginTop: 10, marginBottom: 5, flexWrap: "wrap" },
  tagButton: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: "#e1e1e1", borderRadius: 12 },
  tagButtonActive: { backgroundColor: Colors.awac.navy },
  tagText: { color: "#333", fontWeight: "600" },
  tagTextActive: { color: "#fff", fontWeight: "600" },

  headerText: { fontSize: 32, marginBottom: 10 },

  sessionCard: {
    backgroundColor: Colors.lightestBlue,
    padding: 15,
    borderWidth: 2,
    borderColor: Colors.awac.navy,
    borderRadius: 12,
    gap: 10,
  },
  sessionTitle: { fontSize: 22, marginBottom: 4 },

  categoryTag: {
    backgroundColor: "#e0eaff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  categoryText: { color: "#1a4dbf", fontWeight: "600" },

  row: { flexDirection: "row", gap: 6, alignItems: "center" },
  rowLabel: { fontWeight: "600" },

  sessionCardDetails: {
    backgroundColor: Colors.lightestBlue,
    padding: 15,
    borderWidth: 2,
    borderColor: Colors.awac.navy,
    borderRadius: 12,
    gap: 10,
    position: "relative",
  },

  heartButton: { position: "absolute", right: 25, top: 10, zIndex: 10 },
});

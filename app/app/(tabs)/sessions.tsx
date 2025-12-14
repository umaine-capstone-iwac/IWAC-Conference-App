import { useState } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Input } from '@/components/input';
import { Colors } from '@/constants/theme';
import { router } from 'expo-router';

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
  const allSessions: SessionSlot[] = [
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
  ];

  const tags = ["AI/ML", "Cloud", "DevOps"]; //example tags

  const [search, setSearch] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<SessionSlot | null>(null);
  const [savedPanels, setSavedPanels] = useState<number[]>([]);

const toggleSavePanel = (panelId: number) => {
    setSavedPanels((prev) =>
      prev.includes(panelId) ? prev.filter((x) => x !== panelId) : [...prev, panelId]
    );
  };

  //filter panels by search/tag, but keep them grouped under their session slot
  const filteredSessions = useMemo(() => {
    const q = search.trim().toLowerCase();

    return allSessions
      .map((slot) => {
        const filteredPanels = slot.panels.filter((p) => {
          const matchesSearch =
            !q ||
            p.title.toLowerCase().includes(q) ||
            p.category.toLowerCase().includes(q) ||
            p.speaker.toLowerCase().includes(q) ||
            p.location.toLowerCase().includes(q);

          const matchesTag = tag ? p.category === tag : true;

          return matchesSearch && matchesTag;
        });

        return { ...slot, panels: filteredPanels };
      })
      .filter((slot) => slot.panels.length > 0);
  }, [allSessions, search, tag]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.awac.beige }}>

      {selectedSession && (
        <ScrollView style={styles.scrollContainer}>
          <View style={styles.container}>

            <TouchableOpacity onPress={() => setSelectedSession(null)}>
              <Text style={{ fontSize: 18, color: Colors.awac.navy, marginBottom: 10 }}>
                ← Back
              </Text>
            </TouchableOpacity>

            <ThemedText type="title" style={styles.headerText}>
              {selectedSession.title}
            </ThemedText>

            <ThemedView style={styles.sessionCard}>
            <TouchableOpacity
              style={styles.heartButton}
              onPress={() => toggleSave(selectedSession.id)}
            >
            <Text style={{
              fontSize: 55,
              color: savedSessions.includes(selectedSession.id) ? "red" : "#888"}}>
              ♥
            </Text>
            </TouchableOpacity>


              <View style={styles.categoryTag}>
                <Text style={styles.categoryText}>{selectedSession.category}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Date:</Text>
                <ThemedText>{selectedSession.date}</ThemedText>
              </View>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Location:</Text>
                <ThemedText>{selectedSession.location}</ThemedText>
              </View>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Lecturer:</Text>
                <ThemedText>{selectedSession.lecturer}</ThemedText>
              </View>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Description:</Text>
                <ThemedText>{selectedSession.description}</ThemedText>
              </View>

            </ThemedView>

          </View>
        </ScrollView>
      )}
    
      {!selectedSession && (
        <ScrollView style={styles.scrollContainer}>
          <View style={styles.container}>

            <Input
              text="Search sessions..."
              value={search}
              onChangeText={setSearch}
              style={styles.searchBar}
            />

            <View style={styles.tagRow}>
              {tags.map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.tagButton, tag === t && styles.tagButtonActive]}
                  onPress={() => setTag(tag === t ? null : t)}
                >
                  <Text style={tag === t ? styles.tagTextActive : styles.tagText}>
                    {t}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <ThemedText type="title" style={styles.headerText}>
              Sessions
            </ThemedText>

            {sessions.map((session) => (
              <TouchableOpacity key={session.id} onPress={() => setSelectedSession(session)}>
                <ThemedView style={styles.sessionCardDetails}>

                    <TouchableOpacity
                      style={styles.heartButton}
                      onPress={() => toggleSave(session.id)}
                    >
                    <Text style={{ fontSize: 40, color: savedSessions.includes(session.id) ? "red" : "#888" }}>
                      ♥
                    </Text>

                    </TouchableOpacity>


                  <ThemedText type="title" style={styles.sessionTitle}>
                    {session.title}
                  </ThemedText>

                  <View style={styles.categoryTag}>
                    <Text style={styles.categoryText}>{session.category}</Text>
                  </View>

                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>Date:</Text>
                    <ThemedText>{session.date}</ThemedText>
                  </View>

                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>Location:</Text>
                    <ThemedText>{session.location}</ThemedText>
                  </View>

                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>Lecturer:</Text>
                    <ThemedText>{session.lecturer}</ThemedText>
                  </View>

                </ThemedView>
              </TouchableOpacity>
            ))}

          </View>
        </ScrollView>
      )}

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderColor: "#e6e6e6",
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
  },
  icon: { fontSize: 20 },
  activeLabel: { color: "#0066ff", fontWeight: "600", fontSize: 13 },
  label: { fontSize: 13, color: "#444" },

  scrollContainer: { backgroundColor: Colors.awac.beige },
  container: { flexDirection: "column", gap: 25, padding: 20 },

  searchBar: {
    height: 50,
    fontSize: 16,
  },

  tagRow: { flexDirection: "row", gap: 10, marginTop: 10, marginBottom: 5 },
  tagButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#e1e1e1",
    borderRadius: 12,
  },
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

  heartButton: {
    position: "absolute",
    right: 25,
    top: 10,
    zIndex: 10,
},
});

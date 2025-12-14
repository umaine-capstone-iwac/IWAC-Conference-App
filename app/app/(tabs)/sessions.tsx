import { useState } from 'react';
import { ScrollView, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Input } from '@/components/input';
import { Colors } from '@/constants/theme';
import { router } from 'expo-router';

//temporary events
export default function EventsScreen() {
  const allEvents = [
    {
      id: 1,
      category: 'AI/ML',
      title: 'AI Research',
      date: 'Mar 14 · 9:00 AM - 10:30 AM',
      location: 'Foster Center for Innovation',
      lecturer: 'Professor Dufour',
      description: 'An introduction to AI research and applications.'
    },
    {
      id: 2,
      category: 'Cloud',
      title: 'Cloud Systems Workshop',
      date: 'Mar 14 · 11:00 AM - 12:30 PM',
      location: 'Neville Hall',
      lecturer: 'Professor Yu',
      description: 'A workshop exploring cloud architecture and distributed systems.'
    },
    {
      id: 3,
      category: 'DevOps',
      title: 'DevOps Best Practices',
      date: 'Mar 14 · 2:00 PM - 3:30 PM',
      location: 'Boardman Hall',
      lecturer: 'Professor Dickens',
      description: 'A talk on CI/CD pipelines and modern DevOps strategies.'
    },
  ];

  const [search, setSearch] = useState("");
  const [tag, setTag] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const tags = ["AI/ML", "Cloud", "DevOps"]; //example tags
  const [savedEvents, setSavedEvents] = useState<number[]>([]);

  const toggleSave = (id: number) => {
  setSavedEvents((prev) =>
    prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
  );
};

  const events = allEvents.filter((event) => {
    const matchesSearch =
      event.title.toLowerCase().includes(search.toLowerCase()) ||
      event.category.toLowerCase().includes(search.toLowerCase()) ||
      event.lecturer.toLowerCase().includes(search.toLowerCase()) ||
      event.location.toLowerCase().includes(search.toLowerCase());

    const matchesTag = tag ? event.category === tag : true;

    return matchesSearch && matchesTag;
  });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: Colors.awac.beige }}>

      {selectedEvent && (
        <ScrollView style={styles.scrollContainer}>
          <View style={styles.container}>

            <TouchableOpacity onPress={() => setSelectedEvent(null)}>
              <Text style={{ fontSize: 18, color: Colors.awac.navy, marginBottom: 10 }}>
                ← Back
              </Text>
            </TouchableOpacity>

            <ThemedText type="title" style={styles.headerText}>
              {selectedEvent.title}
            </ThemedText>

            <ThemedView style={styles.eventCard}>
            <TouchableOpacity
              style={styles.heartButton}
              onPress={() => toggleSave(selectedEvent.id)}
            >
            <Text style={{
              fontSize: 55,
              color: savedEvents.includes(selectedEvent.id) ? "red" : "#888"}}>
              ♥
            </Text>
            </TouchableOpacity>


              <View style={styles.categoryTag}>
                <Text style={styles.categoryText}>{selectedEvent.category}</Text>
              </View>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Date:</Text>
                <ThemedText>{selectedEvent.date}</ThemedText>
              </View>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Location:</Text>
                <ThemedText>{selectedEvent.location}</ThemedText>
              </View>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Lecturer:</Text>
                <ThemedText>{selectedEvent.lecturer}</ThemedText>
              </View>

              <View style={styles.row}>
                <Text style={styles.rowLabel}>Description:</Text>
                <ThemedText>{selectedEvent.description}</ThemedText>
              </View>

            </ThemedView>

          </View>
        </ScrollView>
      )}
    
      {!selectedEvent && (
        <ScrollView style={styles.scrollContainer}>
          <View style={styles.container}>

            <Input
              text="Search events..."
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
              Events
            </ThemedText>

            {events.map((event) => (
              <TouchableOpacity key={event.id} onPress={() => setSelectedEvent(event)}>
                <ThemedView style={styles.eventCardDetails}>

                    <TouchableOpacity
                      style={styles.heartButton}
                      onPress={() => toggleSave(event.id)}
                    >
                    <Text style={{ fontSize: 40, color: savedEvents.includes(event.id) ? "red" : "#888" }}>
                      ♥
                    </Text>

                    </TouchableOpacity>


                  <ThemedText type="title" style={styles.eventTitle}>
                    {event.title}
                  </ThemedText>

                  <View style={styles.categoryTag}>
                    <Text style={styles.categoryText}>{event.category}</Text>
                  </View>

                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>Date:</Text>
                    <ThemedText>{event.date}</ThemedText>
                  </View>

                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>Location:</Text>
                    <ThemedText>{event.location}</ThemedText>
                  </View>

                  <View style={styles.row}>
                    <Text style={styles.rowLabel}>Lecturer:</Text>
                    <ThemedText>{event.lecturer}</ThemedText>
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

  eventCard: {
    backgroundColor: Colors.lightestBlue,
    padding: 15,
    borderWidth: 2,
    borderColor: Colors.awac.navy,
    borderRadius: 12,
    gap: 10,
  },
  eventTitle: { fontSize: 22, marginBottom: 4 },

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

  eventCardDetails: {
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

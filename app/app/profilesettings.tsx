import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Input } from '@/components/input';
import { Colors } from '@/constants/theme';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';

export default function ProfileSettingsModal() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userID, setUserID] = useState<string | undefined>();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profession, setProfession] = useState('');
  const [aboutMe, setAboutMe] = useState('');
  const [interests, setInterests] = useState('');
  const [mySessions, setMySessions] = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        const id = data.session?.user?.id;
        setUserID(id || undefined);

        if (!id) {
          setLoading(false);
          return;
        }

        const { data: profileRows, error: fetchError } = await supabase
          .from('profiles')
          .select(
            'first_name, last_name, profession, about_me, interests, my_sessions',
          )
          .eq('id', id)
          .single();

        if (fetchError) throw fetchError;

        if (profileRows) {
          setFirstName(profileRows.first_name ?? '');
          setLastName(profileRows.last_name ?? '');
          setProfession(profileRows.profession ?? '');
          setAboutMe(profileRows.about_me ?? '');
          setInterests(profileRows.interests ?? '');
          setMySessions(profileRows.my_sessions ?? '');
        }
      } catch (err) {
        console.error('Error loading profile for edit:', err);
        Alert.alert('Error', 'Could not load profile data.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const saveChanges = async () => {
    if (!userID) {
      Alert.alert('Not signed in');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        id: userID,
        first_name: firstName,
        last_name: lastName,
        profession: profession,
        about_me: aboutMe,
        interests: interests,
        my_sessions: mySessions,
      };

      const { error } = await supabase.from('profiles').upsert(payload);
      if (error) throw error;

      Alert.alert('Saved', 'Profile updated successfully');
      router.back();
    } catch (err) {
      console.error('Error saving profile:', err);
      Alert.alert('Error', 'Failed to save profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.umaine.darkBlue} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <ThemedText type="subtitle" style={styles.subtitle}>
          Edit your profile information below:
        </ThemedText>

        <View style={styles.inputGroup}>
          <ThemedText type="title" style={styles.label}>
            First name
          </ThemedText>
          <Input
            value={firstName}
            onChangeText={setFirstName}
            style={styles.input}
            text={''}
          />
        </View>

        <View style={styles.inputGroup}>
          <ThemedText type="title" style={styles.label}>
            Last name
          </ThemedText>
          <Input
            value={lastName}
            onChangeText={setLastName}
            style={styles.input}
            text={''}
          />
        </View>

        <View style={styles.inputGroup}>
          <ThemedText type="title" style={styles.label}>
            Institutional Affiliation
          </ThemedText>
          <Input
            value={profession}
            onChangeText={setProfession}
            style={styles.input}
            text={''}
          />
        </View>

        <View style={styles.inputGroup}>
          <ThemedText type="title" style={styles.label}>
            About Me
          </ThemedText>
          <Input
            value={aboutMe}
            onChangeText={setAboutMe}
            multiline
            style={[styles.input, { height: 120 }]}
            text={''}
          />
        </View>

        <View style={styles.inputGroup}>
          <ThemedText type="title" style={styles.label}>
            Interests
          </ThemedText>
          <Input
            value={interests}
            onChangeText={setInterests}
            multiline
            style={[styles.input, { height: 120 }]}
            text={''}
          />
        </View>

        <View style={styles.inputGroup}>
          <ThemedText type="title" style={styles.label}>
            My Sessions
          </ThemedText>
          <Input
            value={mySessions}
            onChangeText={setMySessions}
            multiline
            style={[styles.input, { height: 140 }]}
            text={''}
          />
        </View>

        <TouchableOpacity onPress={saveChanges} disabled={saving}>
          <View style={styles.button}>
            <Text style={styles.buttonText}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.awac.beige,
  },
  contentContainer: {
    padding: 20,
  },
  title: {
    fontSize: 28,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    backgroundColor: Colors.lightestBlue,
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: Colors.awac.orange,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

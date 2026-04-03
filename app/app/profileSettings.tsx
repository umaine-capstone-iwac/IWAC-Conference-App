import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { ThemedText } from '@/components/themedText';
import { Input } from '@/components/input';
import { Colors } from '@/constants/theme';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { ProfilePicture } from '@/components/profilePicture';

export default function ProfileSettingsModal() {
  // State for loading and saving status
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [userID, setUserID] = useState<string | undefined>();

  // Profile details state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [profession, setProfession] = useState('');
  const [contact_info, setContact] = useState('');
  const [aboutMe, setAboutMe] = useState('');
  const [interests, setInterests] = useState('');
  const [mySessions, setMySessions] = useState('');

  // State for handling profile picture updates
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [avatarPath, setAvatarPath] = useState<string | null>(null);

  // -- DATA LOADING -- //

  // Load the user's profile data
  useEffect(() => {
    const load = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        const id = data.session?.user?.id;
        setUserID(id || undefined);

        // If we don't have a user ID, we can't load profile data
        if (!id) {
          setLoading(false);
          return;
        }

        // Fetch profile details and user names in parallel, from different tables
        const [
          { data: profileRows, error: pErr },
          { data: userRows, error: uErr },
        ] = await Promise.all([
          supabase
            .from('profiles')
            .select(
              'id, profession, contact_info, about_me, interests, my_sessions, avatar_url',
            )
            .eq('id', id)
            .single(),

          supabase
            .from('users')
            .select('first_name, last_name')
            .eq('id', id)
            .single(),
        ]);

        if (pErr || uErr) throw pErr ?? uErr;

        // Set the first and last name states from the users table
        if (userRows) {
          setFirstName(userRows.first_name ?? '');
          setLastName(userRows.last_name ?? '');
        }

        // Set the rest of the profile details from the profiles table
        if (profileRows) {
          setProfession(profileRows.profession ?? '');
          setContact(profileRows.contact_info ?? '');
          setAboutMe(profileRows.about_me ?? '');
          setInterests(profileRows.interests ?? '');
          setMySessions(profileRows.my_sessions ?? '');
          setAvatarUri(profileRows.avatar_url ?? null);
          setAvatarPath(profileRows.avatar_url ?? null);
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

  // -- IMAGE HANDLING -- //

  // Function to handle updating the profile picture
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 1,
      });

      if (!result.canceled && result.assets[0]) {
        setAvatarUri(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Error picking image:', err);
      Alert.alert('Error', 'Failed to pick image.');
    }
  };

  // Upload the new avatar to Supabase, return the public URL
  const uploadAvatar = async (): Promise<string | null> => {
    if (!avatarUri || !userID) return null;

    setUploading(true);
    try {
      const fileName = `${userID}-${Date.now()}.jpg`;

      //fetch the image and convert it into a blob (binary large object)
      const response = await fetch(avatarUri);
      const blob = await response.blob();

      // Upload the blob to Supabase storage
      const { error } = await supabase.storage
        .from('avatars')
        .upload(fileName, blob as never);
      if (error) throw error;

      // Get the public URL of the uploaded image
      const {
        data: { publicUrl },
      } = supabase.storage.from('avatars').getPublicUrl(fileName);

      return publicUrl;
    } catch (err) {
      console.error('Error uploading avatar:', err);
      Alert.alert('Error', 'Failed to upload avatar.');
      return null;
    } finally {
      setUploading(false);
    }
  };

  // Function to save all profile changes to Supabase
  const saveChanges = async () => {
    const trimmedFirst = firstName.trim();
    const trimmedLast = lastName.trim();

    if (trimmedFirst === '' || !trimmedLast) {
      Alert.alert('Invalid Name', 'First name and last name cannot be empty.');
      return;
    }
    if (!userID) {
      Alert.alert('Not signed in');
      return;
    }
    setSaving(true);
    try {
      let avatarUrl = avatarPath;

      // Upload new avatar if changed
      if (avatarUri && avatarUri !== avatarPath) {
        const uploadedUrl = await uploadAvatar();
        if (uploadedUrl) {
          avatarUrl = uploadedUrl;
        }
      }

      // Update names in the users table
      const { error: userError } = await supabase
        .from('users')
        .update({ first_name: trimmedFirst, last_name: trimmedLast })
        .eq('id', userID);
      if (userError) throw userError;

      // Update profile details in the profiles table
      const payload = {
        id: userID,
        profession: profession,
        contact_info: contact_info,
        about_me: aboutMe,
        interests: interests,
        my_sessions: mySessions,
        avatar_url: avatarUrl,
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

  // -- RENDERING -- //
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.umaine.darkBlue} />
      </View>
    );
  }

  // -- UI -- //
  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={80}
    >
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <ThemedText type="subtitle" style={styles.subtitle}>
            Edit your profile information below:
          </ThemedText>

          <TouchableOpacity onPress={pickImage}>
            <View style={styles.avatarContainer}>
              <ProfilePicture size={75} avatarUrl={avatarUri} />
              <Text style={styles.avatarText}>Change Picture</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.inputGroup}>
            <ThemedText type="title" style={styles.label}>
              First name
            </ThemedText>
            <Input
              value={firstName}
              onChangeText={setFirstName}
              multiline
              numberOfLines={5}
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
              multiline
              numberOfLines={5}
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
              multiline
              numberOfLines={5}
              text={''}
            />
          </View>

          <View style={styles.inputGroup}>
            <ThemedText type="title" style={styles.label}>
              Contact Info
            </ThemedText>
            <Input
              value={contact_info}
              onChangeText={setContact}
              multiline
              numberOfLines={5}
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
              numberOfLines={5}
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
              numberOfLines={5}
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
              numberOfLines={5}
              text={''}
            />
          </View>

          <TouchableOpacity
            onPress={saveChanges}
            disabled={saving || uploading}
          >
            <View style={styles.button}>
              <Text style={styles.buttonText}>
                {saving || uploading ? 'Saving...' : 'Save Changes'}
              </Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
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
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  avatarText: {
    color: Colors.awac.navy,
    fontSize: 14,
    fontWeight: '600',
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
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

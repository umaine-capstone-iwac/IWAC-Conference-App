import { StyleSheet, Text, View, ScrollView, Pressable } from 'react-native';
import { ProfilePicture } from '@/components/profilePicture';
import { ThemedText } from '@/components/themedText';
import { ThemedView } from '@/components/themedView';
import { router, useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { useState, useEffect, useCallback } from 'react';
import { IconSymbol } from '@/components/ui/icon-symbol';
import ActionModal from '@/app/modals/action';

// -- INTERFACES -- //

interface ProfileDetails {
  id: string;
  first_name: string;
  last_name: string;
  profession: string;
  contact_info: string;
  about_me: string;
  interests: string;
  my_sessions: string;
  avatar_url: string | null;
}

type ProfileMode = 'self' | 'muted' | 'full';

// Null = not yet loaded, avoids false 'full' flash before block check resolves
interface SocialState {
  isBlockedByMe: boolean | null;
  isBlockedByThem: boolean | null;
  isReported: boolean | null;
}

export default function ProfileScreen() {
  // -- STATE -- //
  const [userID, setUserID] = useState<string | undefined>();
  const [profile, setProfileData] = useState<ProfileDetails | null>(null);
  const { otherUserID } = useLocalSearchParams();

  const viewedUserID =
    otherUserID && String(otherUserID) !== userID
      ? String(otherUserID)
      : userID;

  const isOwnProfile =
    userID && viewedUserID && String(userID) === String(viewedUserID);

  // Social state - null means "not yet fetched" to prevent false rendering
  const [social, setSocial] = useState<SocialState>({
    isBlockedByMe: null,
    isBlockedByThem: null,
    isReported: null,
  });

  // Report selected state - snapshot of isReported when modal opens
  const [selectedReportState, setSelectedReportState] = useState<
    boolean | null
  >(null);

  // Modal visibility state
  const [logoutModalVisible, setLogoutModalVisible] = useState(false);
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [blockModalVisible, setBlockModalVisible] = useState(false);

  // -- DATA LOADING -- //

  // Fetch the logged in user's ID once on mount
  useEffect(() => {
    const loadUser = async () => {
      setUserID((await supabase.auth.getSession()).data.session?.user?.id);
    };
    loadUser();
  }, []);

  const fetchProfileData = useCallback(async () => {
    if (!viewedUserID || !userID) return; // Wait until both IDs are available

    // Reset social state before fetching to avoid stale values on re-visit
    setSocial({
      isBlockedByMe: null,
      isBlockedByThem: null,
      isReported: null,
    });

    // Fetch block/report status for other users only
    if (userID !== viewedUserID) {
      const [{ data: blockByMe }, { data: blockByThem }, { data: reportData }] =
        await Promise.all([
          // I blocked them
          supabase
            .from('blocks')
            .select('id')
            .eq('blocker_user_id', userID)
            .eq('blocked_user_id', viewedUserID)
            .maybeSingle(),

          // They blocked me
          supabase
            .from('blocks')
            .select('id')
            .eq('blocker_user_id', viewedUserID)
            .eq('blocked_user_id', userID)
            .maybeSingle(),

          // Report
          supabase
            .from('reports')
            .select('id')
            .eq('reporter_user_id', userID)
            .eq('target_type', 'profile')
            .eq('target_id', viewedUserID)
            .maybeSingle(),
        ]);

      setSocial({
        isBlockedByMe: !!blockByMe,
        isBlockedByThem: !!blockByThem,
        isReported: !!reportData,
      });
    } else {
      // Own profile - no block/report state needed
      setSocial({
        isBlockedByMe: false,
        isBlockedByThem: false,
        isReported: false,
      });
    }

    // Fetch profile + user name in parallel
    try {
      const [
        { data: profileRow, error: pErr },
        { data: userRow, error: uErr },
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select(
            'id, profession, contact_info, about_me, interests, my_sessions, avatar_url',
          )
          .eq('id', viewedUserID)
          .single(),

        supabase
          .from('users')
          .select('first_name, last_name')
          .eq('id', viewedUserID)
          .single(),
      ]);

      // Profile row missing = deleted user, force sign out
      if (pErr?.code === 'PGRST116' || uErr?.code === 'PGRST116') {
        await supabase.auth.signOut();
        router.push('/login');
        return;
      }

      if (pErr || uErr) {
        console.error('Error fetching profile data:', pErr ?? uErr);
        setProfileData(null);
        return;
      }

      // Map the data into a structure we want
      const mapped: ProfileDetails = {
        id: profileRow.id,
        first_name: userRow?.first_name ?? '',
        last_name: userRow?.last_name ?? '',
        profession: profileRow.profession ?? '',
        contact_info: profileRow.contact_info ?? '',
        about_me: profileRow.about_me ?? '',
        interests: profileRow.interests ?? '',
        my_sessions: profileRow.my_sessions ?? '',
        avatar_url: profileRow.avatar_url,
      };

      setProfileData(mapped);
    } catch (err) {
      console.error('Unexpected error fetching profile data:', err);
    }
  }, [viewedUserID, userID]); // userID must be here - block check depends on it

  // -- DATA MODIFYING -- //

  // Block or unblock the viewed user
  const toggleBlockUser = async () => {
    if (!userID || !viewedUserID) return;

    if (social.isBlockedByMe) {
      await supabase
        .from('blocks')
        .delete()
        .eq('blocker_user_id', userID)
        .eq('blocked_user_id', viewedUserID);

      setSocial((prev) => ({ ...prev, isBlockedByMe: false }));
    } else {
      await supabase.from('blocks').insert({
        blocker_user_id: userID,
        blocked_user_id: viewedUserID,
      });

      setSocial((prev) => ({ ...prev, isBlockedByMe: true }));
    }
  };

  // Report or unreport the viewed user's profile
  const toggleReportUser = async () => {
    if (!userID || !viewedUserID) return;

    if (social.isReported) {
      await supabase
        .from('reports')
        .delete()
        .eq('reporter_user_id', userID)
        .eq('target_type', 'profile')
        .eq('target_id', viewedUserID);

      setSocial((prev) => ({ ...prev, isReported: false }));
    } else {
      await supabase.from('reports').insert({
        reporter_user_id: userID,
        target_type: 'profile',
        target_id: viewedUserID,
      });

      setSocial((prev) => ({ ...prev, isReported: true }));
    }
  };

  // -- SCREEN LIFECYCLE -- //

  // Fetch profile data when the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (viewedUserID && userID) fetchProfileData();
    }, [viewedUserID, userID, fetchProfileData]),
  );

  // Also fetch when IDs first become available
  useEffect(() => {
    if (viewedUserID && userID) fetchProfileData();
  }, [viewedUserID, userID, fetchProfileData]);

  // -- DERIVED STATE -- //

  // Wait for social state to be fetched before deriving mode
  // This prevents a 'full' flash before the block check resolves
  const profileMode: ProfileMode | null = (() => {
    if (
      social.isBlockedByMe === null ||
      social.isBlockedByThem === null ||
      social.isReported === null
    )
      return null;

    const isBlocked = social.isBlockedByMe || social.isBlockedByThem;

    if (isOwnProfile) return 'self';
    if (isBlocked) return 'muted';
    return 'full';
  })();

  // Render nothing until we know what mode we're in
  if (!profileMode) return null;

  // -- UI HELPERS -- //

  const renderHeaderButtons = () => {
    switch (profileMode) {
      case 'self':
        return (
          <>
            {/* Edit profile button */}
            <Pressable onPress={() => router.push('/profileSettings')}>
              <View style={styles.editButton}>
                <Text style={styles.editButtonText}>Edit Profile</Text>
              </View>
            </Pressable>

            {/* Logout button */}
            <Pressable onPress={() => setLogoutModalVisible(true)}>
              <View style={styles.editButton}>
                <IconSymbol
                  size={18}
                  name={'rectangle.portrait.and.arrow.right'}
                  color={Colors.awac.beige}
                />
              </View>
            </Pressable>
          </>
        );

      case 'muted':
        return (
          <>
            {/* Report button */}
            <Pressable
              onPress={() => {
                setSelectedReportState(social.isReported);
                setReportModalVisible(true);
              }}
            >
              <View style={styles.editButton}>
                <IconSymbol
                  size={22}
                  name={social.isReported ? 'flag.fill' : 'flag'}
                  color={Colors.awac.beige}
                />
              </View>
            </Pressable>

            {/* Unblock button */}
            <Pressable onPress={() => setBlockModalVisible(true)}>
              <View style={styles.editButton}>
                {social.isBlockedByMe ? (
                  <Text style={styles.editButtonText}>Unblock</Text>
                ) : (
                  <Text style={styles.editButtonText}>Block</Text>
                )}
              </View>
            </Pressable>
          </>
        );

      case 'full':
        return (
          <>
            {/* Message button */}
            <Pressable
              onPress={() =>
                router.push(`/conversation?otherUserID=${viewedUserID}`)
              }
            >
              <View style={styles.editButton}>
                <IconSymbol
                  size={26}
                  name="message.fill"
                  color={Colors.awac.beige}
                />
              </View>
            </Pressable>

            {/* Report button */}
            <Pressable
              onPress={() => {
                setSelectedReportState(social.isReported);
                setReportModalVisible(true);
              }}
            >
              <View style={styles.editButton}>
                <IconSymbol
                  size={22}
                  name={social.isReported ? 'flag.fill' : 'flag'}
                  color={Colors.awac.beige}
                />
              </View>
            </Pressable>

            {/* Block button */}
            <Pressable onPress={() => setBlockModalVisible(true)}>
              <View style={styles.editButton}>
                <IconSymbol size={26} name="nosign" color={Colors.awac.beige} />
              </View>
            </Pressable>
          </>
        );
    }
  };

  // -- UI -- //

  // Blocked users see a minimal profile
  if (profileMode === 'muted') {
    return (
      <ScrollView style={{ backgroundColor: Colors.awac.beige }}>
        <ThemedView style={styles.profileContainer}>
          <ProfilePicture
            size={75}
            avatarUrl={profile?.avatar_url}
            userId={profile?.id}
          />
          <View
            style={{ flexDirection: 'column', gap: 16, alignItems: 'center' }}
          >
            {profile && (
              <ThemedText type="title" style={{ fontSize: 26 }}>
                {profile.first_name} {profile.last_name}
              </ThemedText>
            )}
            <View style={styles.buttonsContainer}>{renderHeaderButtons()}</View>
          </View>
        </ThemedView>
        <ThemedView style={styles.sectionContainer}>
          <ThemedText style={{ textAlign: 'center', fontSize: 16 }}>
            {social.isBlockedByMe
              ? 'You have blocked this user'
              : 'This user profile is not available'}
          </ThemedText>
        </ThemedView>

        {/* Block modal */}
        <ActionModal
          visible={blockModalVisible}
          title="Unblock User"
          caption="Do you want to unblock this user? You will be able to message each other again."
          confirmText="Unblock"
          onClose={() => setBlockModalVisible(false)}
          onConfirm={async () => {
            await toggleBlockUser();
            setBlockModalVisible(false);
          }}
        />

        {/* Report modal */}
        <ActionModal
          visible={reportModalVisible}
          title={selectedReportState ? 'Remove Report' : 'Report User'}
          caption={
            selectedReportState
              ? "Do you want to remove your report for this user's profile?"
              : "Are you sure you want to report this user's profile to an admin?"
          }
          confirmText={selectedReportState ? 'Unreport' : 'Report'}
          onClose={() => setReportModalVisible(false)}
          onConfirm={async () => {
            await toggleReportUser();
          }}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView style={{ backgroundColor: Colors.awac.beige }}>
      <ThemedView style={styles.profileContainer}>
        <ProfilePicture
          size={75}
          avatarUrl={profile?.avatar_url}
          userId={profile?.id}
        />

        <View style={{ flexDirection: 'column', gap: 8 }}>
          {profile && (
            <View>
              <ThemedText type="title" style={{ fontSize: 26 }}>
                {profile.first_name} {profile.last_name}
              </ThemedText>
              <ThemedText type="subtitle" style={{ fontSize: 16 }}>
                {profile.profession}
              </ThemedText>
            </View>
          )}

          <View style={styles.buttonsContainer}>{renderHeaderButtons()}</View>
        </View>
      </ThemedView>

      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle">Contact Information</ThemedText>
        <ThemedText>{profile?.contact_info}</ThemedText>
      </ThemedView>

      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle">About Me</ThemedText>
        <ThemedText>{profile?.about_me}</ThemedText>
      </ThemedView>

      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle">Interests</ThemedText>
        <ThemedText>{profile?.interests}</ThemedText>
      </ThemedView>

      <ThemedView style={styles.sectionContainer}>
        <ThemedText type="subtitle">My Sessions</ThemedText>
        <ThemedText>{profile?.my_sessions}</ThemedText>
      </ThemedView>

      {/* Logout modal */}
      <ActionModal
        visible={logoutModalVisible}
        title="Logout"
        caption="Are you sure you would like to logout?"
        confirmText="Logout"
        onClose={() => setLogoutModalVisible(false)}
        onConfirm={async () => {
          const { error } = await supabase.auth.signOut();

          if (error) {
            console.error('Logout failed:', error.message);
            throw error; // Lets modal show error state
          }

          console.log('User signed out successfully');
          setLogoutModalVisible(false);

          requestAnimationFrame(() => {
            router.replace('/login');
          });
        }}
      />

      {/* Block modal */}
      <ActionModal
        visible={blockModalVisible}
        title={social.isBlockedByMe ? 'Unblock User' : 'Block User'}
        caption={
          social.isBlockedByMe
            ? 'Do you want to unblock this user? You will be able to message each other again.'
            : 'Are you sure you want to block this user? You will not be able to message each other.'
        }
        confirmText={social.isBlockedByMe ? 'Unblock' : 'Block'}
        onClose={() => setBlockModalVisible(false)}
        onConfirm={async () => {
          await toggleBlockUser();
          setBlockModalVisible(false);
        }}
      />

      {/* Report modal */}
      <ActionModal
        visible={reportModalVisible}
        title={selectedReportState ? 'Remove Report' : 'Report User'}
        caption={
          selectedReportState
            ? "Do you want to remove your report for this user's profile?"
            : "Are you sure you want to report this user's profile to an admin?"
        }
        confirmText={selectedReportState ? 'Unreport' : 'Report'}
        successMessage={
          selectedReportState
            ? 'Report successfully removed.'
            : 'Profile successfully reported to an administrator. They will review the content within 24 hours and take action as necessary.'
        }
        onClose={() => setReportModalVisible(false)}
        onConfirm={async () => {
          await toggleReportUser();
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileContainer: {
    backgroundColor: Colors.lightestBlue,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  sectionContainer: {
    gap: 8,
    margin: 10,
    padding: 10,
    borderColor: Colors.awac.navy,
    borderWidth: 2,
    borderRadius: 8,
  },
  editButton: {
    backgroundColor: Colors.umaine.darkBlue,
    paddingHorizontal: 10,
    borderRadius: 8,
    height: 40,
    justifyContent: 'center',
  },
  editButtonText: {
    color: Colors.awac.beige,
    fontSize: 14,
    fontWeight: '600',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
});

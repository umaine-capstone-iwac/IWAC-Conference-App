import { Image, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';

export type ProfilePictureProps = {
  size: number;
  avatarUrl?: string | null;
  userId?: string;
};

export function ProfilePicture({
  size,
  avatarUrl,
  userId,
}: ProfilePictureProps) {
  const image = avatarUrl ? (
    <Image
      source={{
        uri: avatarUrl,
      }}
      style={[
        styles.profilePicture,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
      onError={(e) => {
        console.error('Profile image load error:', e.nativeEvent);
      }}
      accessibilityLabel="Profile picture"
    />
  ) : (
    <Image
      source={require('@/assets/images/profile-picture.png')}
      style={[
        styles.profilePicture,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    />
  );

  if (userId) {
    return (
      <Pressable
        onPress={() => router.replace(`/profile?otherUserID=${userId}`)}
      >
        {image}
      </Pressable>
    );
  }

  return image;
}

const styles = StyleSheet.create({
  profilePicture: {
    resizeMode: 'cover',
  },
});

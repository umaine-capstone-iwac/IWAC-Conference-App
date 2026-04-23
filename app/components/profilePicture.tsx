import { Image, StyleSheet, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useState, useEffect } from 'react';

export type ProfilePictureProps = {
  size: number;
  avatarUrl?: string | null;
  userId?: string;
};

// -- COMPONENT -- //
export function ProfilePicture({
  size,
  avatarUrl,
  userId,
}: ProfilePictureProps) {
  const [imageLoadFailed, setImageLoadFailed] = useState(false);

  // Reset imageLoadFailed when avatarUrl changes
  useEffect(() => {
    setImageLoadFailed(false);
  }, [avatarUrl]);

  const image =
    avatarUrl && !imageLoadFailed ? (
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
          setImageLoadFailed(true);
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

  // -- NAVIGATION -- //

  // If a userId is provided, make the profile picture clickable to navigate to that user's profile
  if (userId) {
    return (
      <Pressable
        onPress={() => router.replace(`/profile?otherUserID=${userId}`)}
        hitSlop={10}
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

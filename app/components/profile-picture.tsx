import { Image, StyleSheet, ImageSourcePropType, Pressable } from 'react-native';
import { router } from 'expo-router';

export type ProfilePictureProps = {
  size: number;
  source: ImageSourcePropType;
  userId?: string;
};

export function ProfilePicture({ size, source, userId }: ProfilePictureProps) {
  const image = (
    <Image
      source={source}
      style={[
        styles.profilePicture,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    />
  );

  if (userId) {
    return (
      <Pressable onPress={() => router.push(`/profile?otherUserID=${userId}`)}>
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

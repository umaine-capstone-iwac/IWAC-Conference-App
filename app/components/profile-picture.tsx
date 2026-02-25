import { Image, StyleSheet, ImageSourcePropType } from 'react-native';

export type ProfilePictureProps = {
  size: number;
  source: ImageSourcePropType;
};

export function ProfilePicture({ size, source }: ProfilePictureProps) {
  return (
    <Image
      source={source}
      style={[
        styles.profilePicture,
        { width: size, height: size, borderRadius: size / 2 },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  profilePicture: {
    resizeMode: 'cover',
  },
});

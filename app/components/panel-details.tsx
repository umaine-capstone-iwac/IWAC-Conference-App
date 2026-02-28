import { useRef, useState, useCallback, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Linking,
  Image,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Input } from '@/components/input';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';

// -- Types -- //

export type Panel = {
  id: number;
  title: string;
  location: string;
  speaker: string;
  date: string;
  session: string;
  tag: string;
};

type PanelResource = {
  id: number;
  created_at: string;
  event_id: number;
  type: string | null;
  title: string | null;
  url: string;
};

type Comment = {
  comment_id: string;
  user_id: string;
  comment_content: string;
  created_at: string;
};

type Props = {
  panel: Panel;
  userID: string | undefined;
  onBack: () => void;
};

// -- Component -- //

export default function PanelDetail({ panel, userID, onBack }: Props) {
  const scrollRef = useRef<ScrollView>(null);

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [resources, setResources] = useState<PanelResource[]>([]);
  const [resourcesLoading, setResourcesLoading] = useState(true);

  // -- Helpers -- //

  const isPdfUrl = (url: string) => /\.pdf(\?|#|$)/i.test(url);

  const getYouTubeId = (url: string) => {
    try {
      const u = new URL(url);
      if (u.hostname === 'youtu.be') return u.pathname.split('/')[1] || null;
      if (
        (u.hostname === 'youtube.com' || u.hostname === 'www.youtube.com') &&
        u.pathname === '/watch'
      )
        return u.searchParams.get('v');
      return null;
    } catch {
      return null;
    }
  };

  const openUrl = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) { Alert.alert("Can't open link"); return; }
      await Linking.openURL(url);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to open link');
    }
  };

  const downloadPdf = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) { Alert.alert("Can't download file"); return; }
      await Linking.openURL(url);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to download PDF');
    }
  };

  // -- Data Fetching -- //

  const fetchComments = useCallback(async () => {
    setCommentsLoading(true);
    const { data, error } = await supabase
      .from('panel_comments')
      .select('comment_id, user_id, comment_content, created_at')
      .eq('event_id', panel.id)
      .order('created_at', { ascending: true });
    if (error) console.error(error);
    else setComments(data ?? []);
    setCommentsLoading(false);
  }, [panel.id]);

  const fetchResources = useCallback(async () => {
    setResourcesLoading(true);
    const { data, error } = await supabase
      .from('panel_resources')
      .select('id, created_at, event_id, type, title, url')
      .eq('event_id', panel.id)
      .order('created_at', { ascending: true });
    if (error) console.error(error);
    else setResources((data ?? []) as PanelResource[]);
    setResourcesLoading(false);
  }, [panel.id]);

  useEffect(() => {
    fetchComments();
    fetchResources();
  }, [fetchComments, fetchResources]);

  // -- Comment Submission -- //

  const submitComment = async () => {
    if (!userID) { Alert.alert('Sign in required'); return; }
    if (!newComment.trim()) return;

    setSubmitting(true);
    const { error } = await supabase.from('panel_comments').insert({
      user_id: userID,
      event_id: panel.id,
      comment_content: newComment.trim(),
    });

    if (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to post comment');
    } else {
      setNewComment('');
      await fetchComments();
      scrollRef.current?.scrollToEnd({ animated: true });
    }
    setSubmitting(false);
  };

  // -- Rendering -- //

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 160 : 60}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.scrollContainer}
        keyboardShouldPersistTaps="always"
        contentContainerStyle={{ paddingBottom: 40 }}
      >
        <View style={styles.container}>
          {/* Back button */}
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.backButton}>← Back</Text>
          </TouchableOpacity>

          {/* Panel card */}
          <View style={styles.panelCard}>
            <View style={styles.dateTag}>
              <Text style={styles.dateText}>{panel.date}</Text>
            </View>

            <ThemedText style={styles.title}>{panel.title}</ThemedText>

            <View style={styles.detailRow}>
              <IconSymbol size={20} name="clock.fill" color={Colors.awac.navy} />
              <ThemedText style={styles.detailText}>{panel.session}</ThemedText>
            </View>

            <View style={styles.detailRow}>
              <IconSymbol size={20} name="mappin.circle.fill" color={Colors.awac.navy} />
              <ThemedText style={styles.detailText}>{panel.location}</ThemedText>
            </View>

            <View style={styles.detailRow}>
              <IconSymbol size={20} name="person.fill" color={Colors.awac.navy} />
              <ThemedText style={styles.detailText}>{panel.speaker}</ThemedText>
            </View>

            {panel.tag ? (
              <View style={styles.tagPill}>
                <Text style={styles.tagText}>{panel.tag}</Text>
              </View>
            ) : null}
          </View>

          {/* Resources Section */}
          <ThemedText style={styles.sectionHeader}>Resources</ThemedText>
          {resourcesLoading ? (
            <ActivityIndicator size="small" color={Colors.awac.navy} />
          ) : resources.length === 0 ? (
            <ThemedText style={styles.emptyText}>No resources yet</ThemedText>
          ) : (
            resources.map((r) => {
              const url = r.url;
              const title = r.title?.trim() || url;
              const isPdf = r.type?.toLowerCase() === 'pdf' || isPdfUrl(url);
              const ytId = r.type?.toLowerCase() === 'youtube' ? getYouTubeId(url) : null;

              if (isPdf) {
                return (
                  <ThemedView key={r.id} style={styles.resourceCard}>
                    <ThemedText style={styles.resourceTitle}>📄 {title}</ThemedText>
                    <TouchableOpacity onPress={() => downloadPdf(url)} style={styles.resourceButton}>
                      <Text style={styles.resourceButtonText}>Download PDF</Text>
                    </TouchableOpacity>
                  </ThemedView>
                );
              }

              if (ytId) {
                const thumb = `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
                return (
                  <TouchableOpacity key={r.id} activeOpacity={0.85} onPress={() => openUrl(url)}>
                    <ThemedView style={[styles.resourceCard, { gap: 8 }]}>
                      <ThemedText style={styles.resourceTitle}>▶️ {title}</ThemedText>
                      <Image
                        source={{ uri: thumb }}
                        style={{ width: '100%', height: 180, borderRadius: 8 }}
                        resizeMode="cover"
                      />
                      <ThemedText style={{ color: Colors.awac.navy }}>Open YouTube</ThemedText>
                    </ThemedView>
                  </TouchableOpacity>
                );
              }

              return null;
            })
          )}

          {/* Comments Section */}
          <ThemedText style={styles.sectionHeader}>Comments</ThemedText>
          {commentsLoading ? (
            <ActivityIndicator size="small" color={Colors.awac.navy} />
          ) : comments.length === 0 ? (
            <ThemedText style={styles.emptyText}>No comments yet</ThemedText>
          ) : (
            comments.map((c) => (
              <ThemedView key={c.comment_id} style={styles.commentCard}>
                <ThemedText style={styles.commentTime}>
                  {new Date(c.created_at).toLocaleString()}
                </ThemedText>
                <ThemedText>{c.comment_content}</ThemedText>
              </ThemedView>
            ))
          )}

          {/* Comment Input */}
          <View style={styles.commentInputRow}>
            <Input
              text="Add a comment..."
              value={newComment}
              onChangeText={setNewComment}
              style={{ flex: 1 }}
            />
            <TouchableOpacity
              onPress={submitComment}
              disabled={submitting || !newComment.trim()}
              style={[styles.postButton, { opacity: submitting || !newComment.trim() ? 0.5 : 1 }]}
            >
              <Text style={styles.postButtonText}>Post</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// -- Styles -- //

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
    backgroundColor: Colors.awac.beige,
  },
  container: {
    padding: 20,
    gap: 20,
  },
  backButton: {
    fontSize: 18,
    color: Colors.awac.navy,
  },
  panelCard: {
    backgroundColor: Colors.lightestBlue,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.awac.navy,
    padding: 15,
    gap: 12,
  },
  dateTag: {
    backgroundColor: Colors.umaine.lightBlue,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  dateText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.awac.navy,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 15,
  },
  tagPill: {
    backgroundColor: Colors.umaine.lightBlue,
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.awac.navy,
  },
  sectionHeader: {
    fontWeight: '700',
    fontSize: 16,
  },
  emptyText: {
    color: '#888',
  },
  resourceCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.awac.navy,
    backgroundColor: Colors.lightestBlue,
    marginTop: 8,
  },
  resourceTitle: {
    fontWeight: '600',
    marginBottom: 6,
  },
  resourceButton: {
    backgroundColor: Colors.awac.navy,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  resourceButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  commentCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.awac.navy,
    backgroundColor: Colors.lightestBlue,
    marginTop: 8,
  },
  commentTime: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  commentInputRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  postButton: {
    backgroundColor: Colors.awac.navy,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  postButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { ThemedText } from '@/components/themedText';
import { ThemedView } from '@/components/themedView';
import { Input } from '@/components/input';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { ProfilePicture } from '@/components/profilePicture';
import ActionModal from '@/app/modals/action';

// -- TYPES -- //

export type Panel = {
  id: number;
  title: string;
  location: string;
  speaker: string;
  date: string;
  session: string;
  tag: string[] | string | null;
  abstract: string | null;
  materials_title: string | null;
  materials_link: string | null;
};

type Comment = {
  comment_id: number;
  user_id: string;
  comment_content: string;
  created_at: string;
};

type CommentUser = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  avatar_url: string | null;
};

type Props = {
  panel: Panel;
  userID: string | undefined;
  onBack: () => void;
};

// -- COMPONENT -- //

// Strips date from fetched session row
const stripDate = (session: string) => session.replace(/^\S+\s*/, '');

const normalizeTags = (tag: string[] | string | null | undefined) => {
  if (Array.isArray(tag)) return tag;

  if (!tag) return [];

  const trimmed = tag.trim();

  if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
    return trimmed
      .slice(1, -1)
      .split(',')
      .map((t) => t.trim().replace(/^"(.*)"$/, '$1'))
      .filter(Boolean);
  }

  return [trimmed];
};

export default function PanelDetail({ panel, userID, onBack }: Props) {
  const scrollRef = useRef<ScrollView>(null);

  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [commentsLoading, setCommentsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [commentUsers, setCommentUsers] = useState<Record<string, CommentUser>>(
    {},
  );
  const [reportedComments, setReportedComments] = useState<Set<number>>(
    new Set(),
  );
  const [reportModalVisible, setReportModalVisible] = useState(false);
  const [selectedCommentId, setSelectedCommentId] = useState<number | null>(
    null,
  );

  const tags = normalizeTags(panel.tag);

  // -- HELPERS -- //

  // Open session materials link
  const openUrl = async (url: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert("Can't open link");
        return;
      }
      await Linking.openURL(url);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Failed to open link');
    }
  };

  // -- DATA FETCHING -- //

  // Fetch comments under panel
  const fetchComments = useCallback(async () => {
    setCommentsLoading(true);
    const { data, error } = await supabase
      .from('panel_comments')
      .select('comment_id, user_id, comment_content, created_at')
      .eq('panel_id', panel.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error(error);
      setCommentsLoading(false);
      return;
    }

    setComments(data ?? []);

    const uniqueUserIds = [...new Set((data ?? []).map((c) => c.user_id))];

    if (uniqueUserIds.length > 0) {
      const { data: usersData } = await supabase
        .from('users')
        .select('id, first_name, last_name')
        .in('id', uniqueUserIds);

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, avatar_url')
        .in('id', uniqueUserIds);

      const usersMap: Record<string, CommentUser> = {};

      (usersData ?? []).forEach((u) => {
        const profile = profilesData?.find((p) => p.id === u.id);

        usersMap[u.id] = {
          user_id: u.id,
          first_name: u.first_name,
          last_name: u.last_name,
          avatar_url: profile?.avatar_url ?? null,
        };
      });

      setCommentUsers(usersMap);
    } else {
      setCommentUsers({});
    }
    setCommentsLoading(false);
  }, [panel.id]);

  // Fetch comments that the current user has reported
  const fetchReports = useCallback(async () => {
    if (!userID) return;

    const commentIds = comments.map((c) => c.comment_id);

    if (commentIds.length === 0) return;

    const { data, error } = await supabase
      .from('reports')
      .select('target_id')
      .eq('reporter_user_id', userID)
      .eq('target_type', 'comment')
      .in('target_id', commentIds);

    if (error) {
      console.error('Error fetching reports:', error);
      return;
    }

    const reportedSet = new Set((data ?? []).map((r) => r.target_id));
    setReportedComments(reportedSet);
  }, [userID, comments]);

  // -- SCREEN EFFECTS -- //
  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  useEffect(() => {
    fetchReports();
  }, [comments, userID]);

  // -- COMMENT DELETION -- //
  const deleteComment = async (commentId: number) => {
    const { error } = await supabase
      .from('panel_comments')
      .delete()
      .eq('comment_id', commentId)
      .eq('user_id', userID);
    if (!error) {
      setComments((prev) => prev.filter((c) => c.comment_id !== commentId));
    } else {
      Alert.alert('Error', 'Failed to delete comment');
    }
  };

  // -- COMMENT SUBMISSION -- //

  const submitComment = async () => {
    if (!userID) {
      Alert.alert('Sign in required');
      return;
    }
    if (!newComment.trim()) return;

    setSubmitting(true);
    const { error } = await supabase.from('panel_comments').insert({
      user_id: userID,
      panel_id: panel.id,
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

  // -- COMMENT REPORTING -- //

  const toggleReportComment = async (commentId: number) => {
    if (!userID) return;

    const isReported = reportedComments.has(commentId);

    if (isReported) {
      // Unreport
      const { error } = await supabase
        .from('reports')
        .delete()
        .eq('reporter_user_id', userID)
        .eq('target_type', 'comment')
        .eq('target_id', commentId);

      if (error) {
        console.error(error);
        return;
      }

      setReportedComments((prev) => {
        const copy = new Set(prev);
        copy.delete(commentId);
        return copy;
      });
    } else {
      // Report
      const { error } = await supabase.from('reports').insert({
        reporter_user_id: userID,
        target_type: 'comment',
        target_id: commentId,
        reason: null,
      });

      if (error) {
        console.error(error);
        return;
      }

      setReportedComments((prev) => new Set(prev).add(commentId));
    }
  };

  // -- UI -- //

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
              <IconSymbol
                size={20}
                name="clock.fill"
                color={Colors.awac.navy}
              />
              <ThemedText style={styles.detailText}>
                {stripDate(panel.session)}
              </ThemedText>
            </View>

            <View style={styles.detailRow}>
              <IconSymbol
                size={20}
                name="mappin.circle.fill"
                color={Colors.awac.navy}
              />
              <ThemedText style={styles.detailText}>
                {panel.location}
              </ThemedText>
            </View>

            <View style={styles.detailRow}>
              <IconSymbol
                size={20}
                name="person.fill"
                color={Colors.awac.navy}
              />
              <ThemedText style={styles.detailText}>{panel.speaker}</ThemedText>
            </View>

            {tags.length ? (
              <View style={styles.tagsWrap}>
                {tags.map((tag) => (
                  <View key={tag} style={styles.tagPill}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {/* Panel abstract */}
            {panel.abstract ? (
              <View style={styles.abstractSection}>
                <ThemedText style={styles.abstractHeader}>
                  Panel Abstract
                </ThemedText>
                <ThemedText style={styles.abstractText}>
                  {panel.abstract}
                </ThemedText>
              </View>
            ) : null}
          </View>

          {/* Session materials */}
          <ThemedText style={styles.sectionHeader}>
            Session Materials
          </ThemedText>

          {panel.materials_link ? (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => openUrl(panel.materials_link!)}
            >
              <ThemedView style={styles.resourceCard}>
                <ThemedText style={styles.resourceTitle}>
                  {panel.materials_title?.trim() || 'Open Session Materials'}
                </ThemedText>

                <ThemedText style={styles.resourceLink} numberOfLines={1}>
                  {panel.materials_link}
                </ThemedText>
              </ThemedView>
            </TouchableOpacity>
          ) : (
            <ThemedText style={styles.emptyText}>
              No session materials yet
            </ThemedText>
          )}

          {/* Comments Section */}
          <ThemedText style={styles.sectionHeader}>Comments</ThemedText>
          {commentsLoading ? (
            <ActivityIndicator size="small" color={Colors.awac.navy} />
          ) : comments.length === 0 ? (
            <ThemedText style={styles.emptyText}>No comments yet</ThemedText>
          ) : (
            comments.map((c) => {
              const user = commentUsers[c.user_id];
              return (
                <View key={c.comment_id}>
                  <ThemedView style={styles.commentCard}>
                    <View style={styles.commentHeader}>
                      <ProfilePicture
                        size={36}
                        avatarUrl={user?.avatar_url ?? null}
                        userId={c.user_id}
                      />
                      <View style={{ flex: 1 }}>
                        <ThemedText style={styles.commentAuthor}>
                          {user
                            ? `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim()
                            : 'Unknown'}
                        </ThemedText>
                        <ThemedText style={styles.commentTime}>
                          {new Date(c.created_at).toLocaleString()}
                        </ThemedText>
                      </View>
                      {/* Delete or Flag button */}
                      {c.user_id === userID ? (
                        <TouchableOpacity
                          onPress={() => deleteComment(c.comment_id)}
                          style={styles.deleteButton}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Text style={styles.deleteButtonText}>x</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          onPress={() => {
                            setSelectedCommentId(c.comment_id);
                            setReportModalVisible(true);
                          }}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <IconSymbol
                            size={20}
                            name={
                              reportedComments.has(c.comment_id)
                                ? 'flag.fill'
                                : 'flag'
                            }
                            color={
                              reportedComments.has(c.comment_id)
                                ? Colors.awac.orange
                                : Colors.awac.navy
                            }
                          />
                        </TouchableOpacity>
                      )}
                    </View>
                    <ThemedText style={{ marginTop: 6 }}>
                      {c.comment_content}
                    </ThemedText>
                  </ThemedView>
                </View>
              );
            })
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
              style={[
                styles.postButton,
                { opacity: submitting || !newComment.trim() ? 0.5 : 1 },
              ]}
            >
              <Text style={styles.postButtonText}>Post</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      <ActionModal
        visible={reportModalVisible}
        title={
          selectedCommentId && reportedComments.has(selectedCommentId)
            ? 'Remove Report'
            : 'Report Comment'
        }
        caption={
          selectedCommentId && reportedComments.has(selectedCommentId)
            ? 'Do you want to remove your report?'
            : 'Are you sure you want to report this comment?'
        }
        confirmText={
          selectedCommentId && reportedComments.has(selectedCommentId)
            ? 'Unreport'
            : 'Report'
        }
        onClose={() => {
          setReportModalVisible(false);
          setSelectedCommentId(null);
        }}
        onConfirm={async () => {
          if (!selectedCommentId) return;
          await toggleReportComment(selectedCommentId);
          setReportModalVisible(false);
          setSelectedCommentId(null);
        }}
      />
    </KeyboardAvoidingView>
  );
}

// -- STYLES -- //

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
    borderWidth: 2,
    borderColor: Colors.awac.navy,
    borderRadius: 14,
    padding: 18,
    backgroundColor: Colors.lightestBlue,
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
  tagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.awac.navy,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: Colors.awac.beige,
  },

  tagText: {
    color: Colors.awac.navy,
    fontWeight: '600',
  },

  sectionHeader: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.awac.navy,
  },

  abstractSection: {
    marginTop: 6,
    gap: 6,
  },

  abstractHeader: {
    fontWeight: '700',
    color: Colors.awac.navy,
  },

  abstractText: {
    lineHeight: 22,
  },

  resourceCard: {
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.awac.navy,
    borderRadius: 10,
    backgroundColor: Colors.lightestBlue,
    gap: 6,
  },

  resourceTitle: {
    fontWeight: '700',
    color: Colors.awac.navy,
  },

  resourceLink: {
    fontSize: 12,
    color: '#666',
  },
  emptyText: {
    color: '#888',
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
    position: 'relative',
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  commentAuthor: {
    fontWeight: '600',
    fontSize: 14,
  },
  deleteButton: {
    marginLeft: 'auto',
  },
  deleteButtonText: {
    fontSize: 20,
    color: '#888',
    fontWeight: '600',
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

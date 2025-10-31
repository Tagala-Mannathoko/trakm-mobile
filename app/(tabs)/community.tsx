import { useAuth } from '@/contexts/AuthContext';
import { CommunityPost, supabase } from '@/utils/supabase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Comment = {
  comment_id: string;
  post_id: string;
  member_id: string;
  content: string;
  created_at: string;
  neighborhood_members?: { users?: { first_name?: string; last_name?: string } };
};

export default function CommunityScreen() {
  const { user, neighborhoodMember } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [newPost, setNewPost] = useState('');
  const [showNewPost, setShowNewPost] = useState(false);
  const [expandedPostId, setExpandedPostId] = useState<string | null>(null);
  const [commentsByPost, setCommentsByPost] = useState<Record<string, Comment[]>>({});
  const [newCommentByPost, setNewCommentByPost] = useState<Record<string, string>>({});
  const [stats, setStats] = useState({
    activeResidents: 0,
    pendingConcerns: 0,
    upcomingEvents: 0,
  });

  useEffect(() => {
    fetchCommunityData();
  }, []);

  const fetchCommunityData = async () => {
    try {
      // Fetch community posts
      const { data: postsData, error: postsError } = await supabase
        .from('community_posts')
        .select(`
          *,
          neighborhood_members (
            users (
              first_name,
              last_name
            )
          )
        `)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (!postsError) {
        setPosts(postsData || []);
      }

      // Mock stats for demo
      setStats({
        activeResidents: 156,
        pendingConcerns: 3,
        upcomingEvents: 2,
      });
    } catch (error) {
      console.error('Error fetching community data:', error);
    }
  };

  const fetchCommentsForPost = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from('community_comments')
        .select(`
          *,
          neighborhood_members (
            users (
              first_name,
              last_name
            )
          )
        `)
        .eq('post_id', postId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true });

      if (!error) {
        setCommentsByPost(prev => ({ ...prev, [postId]: (data || []) as Comment[] }));
      }
    } catch (e) {
      // Silent fail
    }
  };

  const handleToggleComments = async (postId: string) => {
    const next = expandedPostId === postId ? null : postId;
    setExpandedPostId(next);
    if (next && !commentsByPost[next]) {
      await fetchCommentsForPost(next);
    }
  };

  const handleAddComment = async (postId: string) => {
    const text = (newCommentByPost[postId] || '').trim();
    if (!text) return;
    if (!neighborhoodMember) {
      Alert.alert('Error', 'Member profile not found.');
      return;
    }
    try {
      const { error } = await supabase
        .from('community_comments')
        .insert({
          post_id: postId,
          member_id: neighborhoodMember.member_id,
          content: text,
          is_deleted: false,
          created_at: new Date().toISOString(),
        });
      if (error) {
        Alert.alert('Error', 'Failed to add comment.');
        return;
      }
      setNewCommentByPost(prev => ({ ...prev, [postId]: '' }));
      await fetchCommentsForPost(postId);
    } catch (e) {
      Alert.alert('Error', 'Failed to add comment.');
    }
  };

  const handleCreatePost = async () => {
    if (!newPost.trim()) {
      Alert.alert('Error', 'Please enter a message.');
      return;
    }

    try {
      if (!neighborhoodMember) {
        Alert.alert('Error', 'Member profile not found.');
        return;
      }

      const { error } = await supabase
        .from('community_posts')
        .insert({
          member_id: neighborhoodMember.member_id,
          content: newPost.trim(),
          is_deleted: false,
          created_at: new Date().toISOString(),
        });

      if (error) {
        Alert.alert('Error', 'Failed to post update.');
        return;
      }

      Alert.alert(
        'Post Created',
        'Your community update has been posted successfully.',
        [
          {
            text: 'OK',
            onPress: () => {
              setNewPost('');
              setShowNewPost(false);
              fetchCommunityData();
            }
          }
        ]
      );
    } catch (e) {
      Alert.alert('Error', 'Failed to post update.');
    }
  };

  const formatPostTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const CommunityUpdate = ({ post }: { post: CommunityPost }) => (
    <View style={styles.updateCard}>
      <View style={styles.updateHeader}>
        <View style={styles.updateAuthor}>
          <View style={styles.authorAvatar}>
            <Ionicons name="person" size={20} color="#fff" />
          </View>
          <View style={styles.authorInfo}>
            <Text style={styles.authorName}>
              {post.neighborhood_members?.users?.first_name} {post.neighborhood_members?.users?.last_name}
            </Text>
            <Text style={styles.updateTime}>
              {formatPostTime(post.created_at)}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.moreButton} onPress={() => handleToggleComments(post.post_id)}>
          <Ionicons name={expandedPostId === post.post_id ? 'chevron-up' : 'chatbubble-ellipses'} size={20} color="#666" />
        </TouchableOpacity>
      </View>
      
      <Text style={styles.updateContent}>{post.content}</Text>
      
      <View style={styles.updateActions}>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="heart-outline" size={16} color="#666" />
          <Text style={styles.actionText}>Like</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton} onPress={() => handleToggleComments(post.post_id)}>
          <Ionicons name="chatbubble-outline" size={16} color="#666" />
          <Text style={styles.actionText}>Comment</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share-outline" size={16} color="#666" />
          <Text style={styles.actionText}>Share</Text>
        </TouchableOpacity>
      </View>

      {expandedPostId === post.post_id && (
        <View style={styles.commentsSection}>
          {(commentsByPost[post.post_id] || []).map((c) => (
            <View key={c.comment_id} style={styles.commentRow}>
              <View style={styles.commentAvatar}>
                <Ionicons name="person" size={16} color="#fff" />
              </View>
              <View style={styles.commentBody}>
                <Text style={styles.commentAuthor}>
                  {c.neighborhood_members?.users?.first_name} {c.neighborhood_members?.users?.last_name}
                </Text>
                <Text style={styles.commentText}>{c.content}</Text>
              </View>
            </View>
          ))}

          <View style={styles.commentInputRow}>
            <TextInput
              style={styles.commentInput}
              placeholder="Write a comment..."
              placeholderTextColor="#666"
              value={newCommentByPost[post.post_id] || ''}
              onChangeText={(t) => setNewCommentByPost(prev => ({ ...prev, [post.post_id]: t }))}
            />
            <TouchableOpacity style={styles.commentSend} onPress={() => handleAddComment(post.post_id)}>
              <Ionicons name="send" size={18} color="#4CAF50" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );

  const EventCard = ({ title, date, time, location, description }: {
    title: string;
    date: string;
    time: string;
    location: string;
    description: string;
  }) => (
    <View style={styles.eventCard}>
      <View style={styles.eventHeader}>
        <View style={styles.eventIcon}>
          <Ionicons name="calendar" size={20} color="#4CAF50" />
        </View>
        <View style={styles.eventInfo}>
          <Text style={styles.eventTitle}>{title}</Text>
          <Text style={styles.eventDate}>{date} at {time}</Text>
        </View>
      </View>
      <Text style={styles.eventLocation}>
        <Ionicons name="location" size={14} color="#666" /> {location}
      </Text>
      <Text style={styles.eventDescription}>{description}</Text>
      <TouchableOpacity style={styles.eventButton}>
        <Text style={styles.eventButtonText}>RSVP</Text>
      </TouchableOpacity>
    </View>
  );

  const ConcernCard = ({ resident, location, concern, status, timestamp }: {
    resident: string;
    location: string;
    concern: string;
    status: string;
    timestamp: string;
  }) => (
    <View style={styles.concernCard}>
      <View style={styles.concernHeader}>
        <Text style={styles.concernResident}>{resident}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(status) }]}>
          <Text style={styles.statusText}>{status}</Text>
        </View>
      </View>
      <Text style={styles.concernLocation}>
        <Ionicons name="location" size={14} color="#666" /> {location}
      </Text>
      <Text style={styles.concernText}>{concern}</Text>
      <Text style={styles.concernTime}>{timestamp}</Text>
    </View>
  );

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'resolved':
        return '#4CAF50';
      case 'under review':
        return '#FF9800';
      case 'in progress':
        return '#2196F3';
      default:
        return '#666';
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1a1a1a', '#2d2d2d']}
        style={styles.gradient}
      >
        <ScrollView style={styles.scrollView}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Community</Text>
            <Text style={styles.subtitle}>Stay connected with your neighbors</Text>
          </View>

          {/* Statistics */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.activeResidents}</Text>
              <Text style={styles.statLabel}>Active Residents</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.pendingConcerns}</Text>
              <Text style={styles.statLabel}>Pending Concerns</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.upcomingEvents}</Text>
              <Text style={styles.statLabel}>Upcoming Events</Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowNewPost(true)}
            >
              <Ionicons name="add-circle" size={24} color="#4CAF50" />
              <Text style={styles.actionButtonText}>Quick Message</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="calendar" size={24} color="#2196F3" />
              <Text style={styles.actionButtonText}>Schedule Meeting</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="people" size={24} color="#FF9800" />
              <Text style={styles.actionButtonText}>View Residents</Text>
            </TouchableOpacity>
          </View>

          {/* New Post Input */}
          {showNewPost && (
            <View style={styles.newPostContainer}>
              <Text style={styles.newPostTitle}>Broadcast Message</Text>
              <TextInput
                style={styles.newPostInput}
                placeholder="Share updates with the community..."
                placeholderTextColor="#666"
                value={newPost}
                onChangeText={setNewPost}
                multiline
                numberOfLines={3}
              />
              <View style={styles.newPostActions}>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setShowNewPost(false);
                    setNewPost('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.postButton}
                  onPress={handleCreatePost}
                >
                  <Text style={styles.postButtonText}>Post</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* Upcoming Events */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Events</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            <EventCard
              title="Neighborhood Watch Meeting"
              date="Dec 15, 2024"
              time="7:00 PM"
              location="Community Center"
              description="Monthly meeting to discuss safety updates and community concerns."
            />

            <EventCard
              title="Holiday Safety Campaign"
              date="Dec 20, 2024"
              time="6:00 PM"
              location="Main Street"
              description="Community safety awareness event for the holiday season."
            />
          </View>

          {/* Recent Interactions */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Interactions</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            <ConcernCard
              resident="Sarah Johnson"
              location="123 Oak Street"
              concern="Suspicious activity near the playground"
              status="Under Review"
              timestamp="2 hours ago"
            />

            <ConcernCard
              resident="Mike Chen"
              location="456 Pine Avenue"
              concern="Street light not working properly"
              status="In Progress"
              timestamp="1 day ago"
            />

            <ConcernCard
              resident="Lisa Rodriguez"
              location="789 Elm Drive"
              concern="Noise complaint from construction"
              status="Resolved"
              timestamp="3 days ago"
            />
          </View>

          {/* Community Updates */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Community Updates</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {posts.length > 0 ? (
              posts.map((post) => (
                <CommunityUpdate key={post.post_id} post={post} />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={48} color="#666" />
                <Text style={styles.emptyStateText}>No recent updates</Text>
                <Text style={styles.emptyStateSubtext}>
                  Be the first to share community news and updates
                </Text>
              </View>
            )}
          </View>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#ccc',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    justifyContent: 'space-between',
  },
  statCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#ccc',
  },
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
    justifyContent: 'space-between',
  },
  actionButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  actionButtonText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
  },
  newPostContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 24,
  },
  newPostTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 12,
  },
  newPostInput: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#fff',
    textAlignVertical: 'top',
    minHeight: 80,
    marginBottom: 12,
  },
  newPostActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#666',
  },
  postButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  postButtonText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: 'bold',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  viewAllText: {
    fontSize: 16,
    color: '#4CAF50',
  },
  eventCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 14,
    color: '#ccc',
  },
  eventLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  eventDescription: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 12,
  },
  eventButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
  },
  eventButtonText: {
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
  },
  concernCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  concernHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  concernResident: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  statusBadge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: 'bold',
  },
  concernLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  concernText: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 8,
  },
  concernTime: {
    fontSize: 12,
    color: '#666',
  },
  updateCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  updateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  updateAuthor: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  authorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  authorInfo: {
    flex: 1,
  },
  authorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2,
  },
  updateTime: {
    fontSize: 12,
    color: '#666',
  },
  moreButton: {
    padding: 4,
  },
  updateContent: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 12,
  },
  updateActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  commentsSection: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
    paddingTop: 12,
  },
  commentRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  commentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  commentBody: { flex: 1 },
  commentAuthor: { color: '#fff', fontWeight: '600', marginBottom: 2, fontSize: 12 },
  commentText: { color: '#ccc', fontSize: 12, lineHeight: 18 },
  commentInputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  commentInput: { flex: 1, backgroundColor: '#1a1a1a', color: '#fff', borderRadius: 8, padding: 10 },
  commentSend: { marginLeft: 8, padding: 6 },
  actionText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

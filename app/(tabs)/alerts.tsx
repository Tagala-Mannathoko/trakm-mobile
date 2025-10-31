import { useAuth } from '@/contexts/AuthContext';
import { EmergencyAlert, supabase } from '@/utils/supabase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Notifications from 'expo-notifications';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    RefreshControl,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
    TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AlertsScreen() {
  const { user, securityOfficer, neighborhoodMember } = useAuth();
  const [alerts, setAlerts] = useState<EmergencyAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'active' | 'resolved'>('all');
  const [memberAlertType, setMemberAlertType] = useState<string>('Emergency');
  const [memberAlertDesc, setMemberAlertDesc] = useState<string>('');

  useEffect(() => {
    // Request notification permissions on mount (best moved to a central place in production)
    Notifications.requestPermissionsAsync().catch(() => {});

    // Realtime subscription: notify officers on new active alerts
    const channel = supabase
      .channel('emergency-alerts-realtime')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'emergency_alerts' },
        async (payload: any) => {
          try {
            if (!securityOfficer) return;
            const alert = payload.new as EmergencyAlert;
            if (alert.status !== 'active') return;

            await Notifications.scheduleNotificationAsync({
              content: {
                title: 'New Emergency Alert',
                body: `${alert.alert_type} — ${alert.description || 'No description'}`,
                data: { alert_id: alert.alert_id },
                sound: 'default',
                priority: Notifications.AndroidNotificationPriority.MAX,
              },
              trigger: null, // immediate
            });

            // Refresh list quickly for on-screen visibility
            fetchAlerts();
          } catch (e) {
            // noop
          }
        }
      )
      .subscribe();

    return () => {
      try { channel.unsubscribe(); } catch {}
    };
  }, [securityOfficer, filter]);

  useEffect(() => {
    fetchAlerts();
  }, [filter]);

  const fetchAlerts = async () => {
    try {
      let query = supabase
        .from('emergency_alerts')
        .select(`
          *,
          neighborhood_members (
            users (
              first_name,
              last_name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (!error) {
        setAlerts(data || []);
      }
    } catch (error) {
      console.error('Error fetching alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAlerts();
    setRefreshing(false);
  };

  const handleResolveAlert = async (alertId: string) => {
    if (!securityOfficer) {
      Alert.alert('Error', 'Security officer information not found.');
      return;
    }

    Alert.alert(
      'Resolve Alert',
      'Are you sure you want to mark this alert as resolved?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Resolve',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('emergency_alerts')
                .update({
                  status: 'resolved',
                  resolved_at: new Date().toISOString(),
                  resolved_by_officer_id: securityOfficer.officer_id,
                })
                .eq('alert_id', alertId);

              if (!error) {
                fetchAlerts();
                Alert.alert('Success', 'Alert has been resolved.');
              } else {
                Alert.alert('Error', 'Failed to resolve alert.');
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to resolve alert.');
            }
          }
        }
      ]
    );
  };

  const getPriorityColor = (alertType: string) => {
    switch (alertType.toLowerCase()) {
      case 'armed robbery':
      case 'break-in':
      case 'assault':
        return '#FF4444'; // High priority - Red
      case 'suspicious vehicle':
      case 'vandalism':
        return '#FF8800'; // Medium priority - Orange
      default:
        return '#4CAF50'; // Low priority - Green
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return '#FF4444';
      case 'resolved':
        return '#4CAF50';
      case 'cancelled':
        return '#666';
      default:
        return '#FF9800';
    }
  };

  const formatAlertTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const AlertCard = ({ alert }: { alert: EmergencyAlert }) => (
    <TouchableOpacity style={styles.alertCard}>
      <View style={styles.alertHeader}>
        <View style={styles.alertPriority}>
          <View
            style={[
              styles.priorityDot,
              { backgroundColor: getPriorityColor(alert.alert_type) }
            ]}
          />
          <Text style={styles.alertType}>{alert.alert_type}</Text>
        </View>
        <View style={styles.alertStatus}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: getStatusColor(alert.status) }
            ]}
          />
          <Text style={styles.statusText}>{alert.status.toUpperCase()}</Text>
        </View>
      </View>

      <Text style={styles.alertDescription}>
        {alert.description || 'No description provided'}
      </Text>

      <View style={styles.alertDetails}>
        <View style={styles.alertDetail}>
          <Ionicons name="person" size={16} color="#666" />
          <Text style={styles.alertDetailText}>
            {alert.neighborhood_members?.users?.first_name} {alert.neighborhood_members?.users?.last_name}
          </Text>
        </View>
        <View style={styles.alertDetail}>
          <Ionicons name="time" size={16} color="#666" />
          <Text style={styles.alertDetailText}>
            {formatAlertTime(alert.created_at)}
          </Text>
        </View>
        {alert.latitude && alert.longitude && (
          <View style={styles.alertDetail}>
            <Ionicons name="location" size={16} color="#666" />
            <Text style={styles.alertDetailText}>Location available</Text>
          </View>
        )}
      </View>

      {alert.status === 'active' && securityOfficer && (
        <View style={styles.alertActions}>
          <TouchableOpacity
            style={styles.resolveButton}
            onPress={() => handleResolveAlert(alert.alert_id)}
          >
            <Ionicons name="checkmark-circle" size={20} color="#4CAF50" />
            <Text style={styles.resolveButtonText}>Resolve</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.viewButton}>
            <Ionicons name="eye" size={20} color="#2196F3" />
            <Text style={styles.viewButtonText}>View Details</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );

  const FilterButton = ({ title, value, isActive }: {
    title: string;
    value: 'all' | 'active' | 'resolved';
    isActive: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.filterButton, isActive && styles.filterButtonActive]}
      onPress={() => setFilter(value)}
    >
      <Text style={[styles.filterButtonText, isActive && styles.filterButtonTextActive]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const handleReportAlert = async () => {
    try {
      if (!neighborhoodMember) {
        Alert.alert('Error', 'Member profile not found.');
        return;
      }

      // Minimal quick alert; could be extended to a form
      const { error } = await supabase
        .from('emergency_alerts')
        .insert({
          raised_by_member_id: neighborhoodMember.member_id,
          alert_type: memberAlertType || 'Emergency',
          description: memberAlertDesc || 'Member raised an alarm',
          status: 'active',
          created_at: new Date().toISOString(),
        });

      if (error) {
        Alert.alert('Error', 'Failed to report alert.');
        return;
      }

      Alert.alert('Alert Sent', 'Security officers have been notified.');
      setMemberAlertDesc('');
      fetchAlerts();
    } catch (e) {
      Alert.alert('Error', 'Failed to report alert.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1a1a1a', '#2d2d2d']}
        style={styles.gradient}
      >
        <ScrollView
          style={styles.scrollView}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Emergency Alerts</Text>
            <Text style={styles.subtitle}>Monitor and manage emergency situations</Text>
          </View>

          {/* Statistics */}
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {alerts.filter(alert => alert.status === 'active').length}
              </Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>
                {alerts.filter(alert => alert.status === 'resolved').length}
              </Text>
              <Text style={styles.statLabel}>Resolved</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{alerts.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>

          {/* Member Quick Report Form */}
          {neighborhoodMember && (
            <View style={styles.reportForm}>
              <Text style={styles.sectionTitle}>Report an Emergency</Text>
              <View style={styles.formRow}>
                <TouchableOpacity style={[styles.tag, memberAlertType==='Emergency' && styles.tagActive]} onPress={() => setMemberAlertType('Emergency')}>
                  <Text style={[styles.tagText, memberAlertType==='Emergency' && styles.tagTextActive]}>Emergency</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tag, memberAlertType==='Break-in' && styles.tagActive]} onPress={() => setMemberAlertType('Break-in')}>
                  <Text style={[styles.tagText, memberAlertType==='Break-in' && styles.tagTextActive]}>Break-in</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.tag, memberAlertType==='Suspicious' && styles.tagActive]} onPress={() => setMemberAlertType('Suspicious')}>
                  <Text style={[styles.tagText, memberAlertType==='Suspicious' && styles.tagTextActive]}>Suspicious</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputBox}>
                <Text style={styles.inputLabel}>Description (optional)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Describe the situation..."
                  placeholderTextColor="#666"
                  value={memberAlertDesc}
                  onChangeText={setMemberAlertDesc}
                  multiline
                />
              </View>
              <TouchableOpacity style={styles.reportButton} onPress={handleReportAlert}>
                <Ionicons name="alert" size={18} color="#fff" />
                <Text style={styles.reportButtonText}>Send Alert</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Filter Buttons */}
          <View style={styles.filterContainer}>
            <FilterButton title="All" value="all" isActive={filter === 'all'} />
            <FilterButton title="Active" value="active" isActive={filter === 'active'} />
            <FilterButton title="Resolved" value="resolved" isActive={filter === 'resolved'} />
          </View>

          {/* Quick Actions */}
          <View style={styles.quickActions}>
            <TouchableOpacity style={styles.actionButton} onPress={handleReportAlert}>
              <Ionicons name="add-circle" size={24} color="#4CAF50" />
              <Text style={styles.actionButtonText}>Report Alert</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Ionicons name="map" size={24} color="#2196F3" />
              <Text style={styles.actionButtonText}>View Map</Text>
            </TouchableOpacity>
          </View>

          {/* Alerts List */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {filter === 'all' ? 'All Alerts' : `${filter.charAt(0).toUpperCase() + filter.slice(1)} Alerts`}
            </Text>

            {alerts.length > 0 ? (
              alerts.map((alert) => (
                <AlertCard key={alert.alert_id} alert={alert} />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="shield-checkmark" size={48} color="#4CAF50" />
                <Text style={styles.emptyStateText}>
                  {filter === 'active' ? 'No active alerts' : 'No alerts found'}
                </Text>
                <Text style={styles.emptyStateSubtext}>
                  {filter === 'active' 
                    ? 'Great job! No emergencies at the moment.'
                    : 'No alerts match your current filter.'}
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  reportForm: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 16,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  tag: {
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  tagActive: {
    backgroundColor: '#4CAF50',
  },
  tagText: {
    color: '#ccc',
    fontSize: 12,
  },
  tagTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  inputBox: { marginBottom: 12 },
  inputLabel: { color: '#fff', marginBottom: 6, fontWeight: '500' },
  input: {
    backgroundColor: '#1a1a1a',
    color: '#fff',
    borderRadius: 8,
    padding: 12,
    minHeight: 48,
  },
  reportButton: {
    backgroundColor: '#F44336',
    borderRadius: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  reportButtonText: { color: '#fff', marginLeft: 8, fontWeight: 'bold' },
  filterButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
  },
  filterButtonActive: {
    backgroundColor: '#4CAF50',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#ccc',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
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
    fontSize: 16,
    color: '#fff',
    marginLeft: 8,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16,
  },
  alertCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertPriority: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  alertType: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  alertStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#ccc',
    fontWeight: '500',
  },
  alertDescription: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
    marginBottom: 12,
  },
  alertDetails: {
    marginBottom: 12,
  },
  alertDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  alertDetailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  alertActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resolveButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  resolveButtonText: {
    fontSize: 14,
    color: '#4CAF50',
    marginLeft: 4,
    fontWeight: '500',
  },
  viewButton: {
    backgroundColor: '#1a1a1a',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginLeft: 8,
  },
  viewButtonText: {
    fontSize: 14,
    color: '#2196F3',
    marginLeft: 4,
    fontWeight: '500',
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

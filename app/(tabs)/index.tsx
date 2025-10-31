import { useAuth } from '@/contexts/AuthContext';
import { EmergencyAlert, supabase } from '@/utils/supabase';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
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

export default function DashboardScreen() {
  const { user, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeAlerts, setActiveAlerts] = useState<EmergencyAlert[]>([]);
  const [stats, setStats] = useState({
    activeAlerts: 0,
    activeOfficers: 0,
    weeklyPatrols: 0,
    activeZones: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch active alerts
      const { data: alerts, error: alertsError } = await supabase
        .from('emergency_alerts')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!alertsError) {
        setActiveAlerts(alerts || []);
        setStats(prev => ({ ...prev, activeAlerts: alerts?.length || 0 }));
      }

      // Fetch active officers count
      const { data: officers, error: officersError } = await supabase
        .from('security_officers')
        .select('officer_id')
        .eq('is_permanently_deleted', false);

      if (!officersError) {
        setStats(prev => ({ ...prev, activeOfficers: officers?.length || 0 }));
      }

      // Mock data for demo
      setStats(prev => ({
        ...prev,
        weeklyPatrols: 47,
        activeZones: 3,
      }));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  const handleSignOut = async () => {
    console.log('[Dashboard] Sign out requested');
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', onPress: async () => { console.log('[Dashboard] Sign out confirmed'); await signOut(); } },
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

  const DashboardCard = ({ title, value, icon, color, onPress }: {
    title: string;
    value: string | number;
    icon: string;
    color: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity style={styles.card} onPress={onPress}>
      <View style={styles.cardContent}>
        <View style={[styles.cardIcon, { backgroundColor: color }]}>
          <Ionicons name={icon as any} size={24} color="#fff" />
        </View>
        <View style={styles.cardText}>
          <Text style={styles.cardValue}>{value}</Text>
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1a1a1a', '#2d2d2d']}
        style={styles.gradient}
      >
        <ScrollView style={styles.scrollView}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.greeting}>Welcome back,</Text>
                <Text style={styles.userName}>{user?.first_name} {user?.last_name}</Text>
              </View>
              <TouchableOpacity style={styles.menuButton} onPress={handleSignOut}>
                <Ionicons name="log-out-outline" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search alerts, officers, or locations..."
                placeholderTextColor="#666"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
          </View>

          {/* Dashboard Grid */}
          <View style={styles.dashboardGrid}>
            <DashboardCard
              title="Live Patrol Maps"
              value="3 Active"
              icon="map"
              color="#2196F3"
              onPress={() => router.push('/patrol')}
            />
            <DashboardCard
              title="Patrol Trends"
              value="↑ 12%"
              icon="trending-up"
              color="#FF9800"
              onPress={() => router.push('/reports')}
            />
            <DashboardCard
              title="Active Alerts"
              value={stats.activeAlerts}
              icon="warning"
              color="#F44336"
              onPress={() => router.push('/alerts')}
            />
            <DashboardCard
              title="Scan Option"
              value="QR Scanner"
              icon="qr-code"
              color="#4CAF50"
              onPress={() => router.push('/patrol')}
            />
          </View>

          {/* Statistics Bar */}
          <View style={styles.statsBar}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.activeAlerts}</Text>
              <Text style={styles.statLabel}>Active Alerts</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.activeOfficers}</Text>
              <Text style={styles.statLabel}>Active Officers</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{stats.weeklyPatrols}</Text>
              <Text style={styles.statLabel}>Weekly Patrols</Text>
            </View>
          </View>

          {/* Active Alerts Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Alerts</Text>
              <TouchableOpacity onPress={() => router.push('/alerts')}>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {activeAlerts.length > 0 ? (
              activeAlerts.map((alert) => (
                <TouchableOpacity key={alert.alert_id} style={styles.alertCard}>
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
                    <Text style={styles.alertTime}>
                      {new Date(alert.created_at).toLocaleTimeString()}
                    </Text>
                  </View>
                  <Text style={styles.alertDescription} numberOfLines={2}>
                    {alert.description || 'No description provided'}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="checkmark-circle" size={48} color="#4CAF50" />
                <Text style={styles.emptyStateText}>No active alerts</Text>
                <Text style={styles.emptyStateSubtext}>All clear! Great job keeping the neighborhood safe.</Text>
              </View>
            )}
          </View>

          {/* Active Zones Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Active Zones</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>Live Map</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.zonesContainer}>
              <View style={styles.zoneItem}>
                <View style={[styles.zoneStatus, { backgroundColor: '#4CAF50' }]} />
                <Text style={styles.zoneName}>Zone A - Patrolling</Text>
              </View>
              <View style={styles.zoneItem}>
                <View style={[styles.zoneStatus, { backgroundColor: '#FF9800' }]} />
                <Text style={styles.zoneName}>Zone B - Unpatrolled</Text>
              </View>
              <View style={styles.zoneItem}>
                <View style={[styles.zoneStatus, { backgroundColor: '#F44336' }]} />
                <Text style={styles.zoneName}>Zone C - Pending</Text>
              </View>
            </View>
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 16,
    color: '#ccc',
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  menuButton: {
    padding: 8,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#fff',
  },
  dashboardGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  card: {
    width: '48%',
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    marginRight: '2%',
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardText: {
    flex: 1,
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 14,
    color: '#ccc',
  },
  statsBar: {
    flexDirection: 'row',
    backgroundColor: '#2a2a2a',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    marginBottom: 24,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
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
    textAlign: 'center',
  },
  statDivider: {
    width: 1,
    backgroundColor: '#444',
    marginHorizontal: 8,
  },
  section: {
    marginHorizontal: 20,
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
    marginBottom: 8,
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
  alertTime: {
    fontSize: 14,
    color: '#ccc',
  },
  alertDescription: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 20,
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
  zonesContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
  },
  zoneItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  zoneStatus: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  zoneName: {
    fontSize: 16,
    color: '#fff',
  },
});
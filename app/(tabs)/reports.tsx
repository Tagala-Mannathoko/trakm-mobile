import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ReportsScreen() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState({
    totalPatrols: 0,
    totalAlerts: 0,
    resolvedIncidents: 0,
    activeOfficers: 0,
    averageResponseTime: 0,
    patrolEfficiency: 0,
  });
  const [filter, setFilter] = useState<'all' | 'patrols' | 'alerts' | 'incidents'>('all');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year'>('week');
  const [reports, setReports] = useState([
    {
      id: '1',
      title: 'Weekly Patrol Summary',
      type: 'weekly',
      period: 'Dec 1-7, 2024',
      status: 'completed',
      createdAt: '2024-12-07',
    },
    {
      id: '2',
      title: 'Emergency Response Analysis',
      type: 'monthly',
      period: 'November 2024',
      status: 'completed',
      createdAt: '2024-12-01',
    },
    {
      id: '3',
      title: 'Community Engagement Report',
      type: 'custom',
      period: 'Q4 2024',
      status: 'pending',
      createdAt: '2024-12-05',
    },
  ]);

  useEffect(() => {
    fetchAnalytics();
  }, [filter, dateRange]);

  const fetchAnalytics = async () => {
    try {
      // Mock data for demo - in real app, this would fetch from Supabase
      setAnalytics({
        totalPatrols: 156,
        totalAlerts: 23,
        resolvedIncidents: 19,
        activeOfficers: 8,
        averageResponseTime: 12.5,
        patrolEfficiency: 87.5,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const generateReport = () => {
    Alert.alert(
      'Generate Report',
      'What type of report would you like to generate?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Weekly Summary', onPress: () => handleGenerateReport('weekly') },
        { text: 'Monthly Analysis', onPress: () => handleGenerateReport('monthly') },
        { text: 'Custom Report', onPress: () => handleGenerateReport('custom') },
      ]
    );
  };

  const handleGenerateReport = (type: string) => {
    Alert.alert(
      'Report Generated',
      `Your ${type} report has been generated successfully.`,
      [
        { text: 'View Report', onPress: () => console.log('View report') },
        { text: 'Download PDF', onPress: () => console.log('Download PDF') },
        { text: 'Export Excel', onPress: () => console.log('Export Excel') },
      ]
    );
  };

  const downloadReport = (reportId: string) => {
    Alert.alert(
      'Download Report',
      'Choose download format:',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'PDF', onPress: () => console.log('Download PDF') },
        { text: 'Excel', onPress: () => console.log('Download Excel') },
      ]
    );
  };

  const AnalyticsCard = ({ title, value, icon, color, trend }: {
    title: string;
    value: string | number;
    icon: string;
    color: string;
    trend?: string;
  }) => (
    <View style={styles.analyticsCard}>
      <View style={styles.cardHeader}>
        <View style={[styles.cardIcon, { backgroundColor: color }]}>
          <Ionicons name={icon as any} size={24} color="#fff" />
        </View>
        {trend && (
          <View style={styles.trendContainer}>
            <Ionicons name="trending-up" size={16} color="#4CAF50" />
            <Text style={styles.trendText}>{trend}</Text>
          </View>
        )}
      </View>
      <Text style={styles.cardValue}>{value}</Text>
      <Text style={styles.cardTitle}>{title}</Text>
    </View>
  );

  const FilterButton = ({ title, value, isActive }: {
    title: string;
    value: 'all' | 'patrols' | 'alerts' | 'incidents';
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

  const DateRangeButton = ({ title, value, isActive }: {
    title: string;
    value: 'today' | 'week' | 'month' | 'year';
    isActive: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.dateButton, isActive && styles.dateButtonActive]}
      onPress={() => setDateRange(value)}
    >
      <Text style={[styles.dateButtonText, isActive && styles.dateButtonTextActive]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  const ReportCard = ({ report }: { report: any }) => (
    <View style={styles.reportCard}>
      <View style={styles.reportHeader}>
        <View style={styles.reportInfo}>
          <Text style={styles.reportTitle}>{report.title}</Text>
          <Text style={styles.reportPeriod}>{report.period}</Text>
        </View>
        <View style={styles.reportStatus}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(report.status) }]} />
          <Text style={styles.statusText}>{report.status}</Text>
        </View>
      </View>
      
      <View style={styles.reportActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => downloadReport(report.id)}
        >
          <Ionicons name="download" size={16} color="#4CAF50" />
          <Text style={styles.actionButtonText}>Download</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="eye" size={16} color="#2196F3" />
          <Text style={styles.actionButtonText}>View</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Ionicons name="share" size={16} color="#FF9800" />
          <Text style={styles.actionButtonText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#4CAF50';
      case 'pending':
        return '#FF9800';
      case 'failed':
        return '#F44336';
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
            <Text style={styles.title}>Reports & Analytics</Text>
            <Text style={styles.subtitle}>Track performance and generate insights</Text>
          </View>

          {/* Analytics Overview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Analytics Overview</Text>
            
            <View style={styles.analyticsGrid}>
              <AnalyticsCard
                title="Total Patrols"
                value={analytics.totalPatrols}
                icon="walk"
                color="#2196F3"
                trend="+12%"
              />
              <AnalyticsCard
                title="Total Alerts"
                value={analytics.totalAlerts}
                icon="warning"
                color="#F44336"
                trend="-8%"
              />
              <AnalyticsCard
                title="Resolved Incidents"
                value={analytics.resolvedIncidents}
                icon="checkmark-circle"
                color="#4CAF50"
                trend="+15%"
              />
              <AnalyticsCard
                title="Active Officers"
                value={analytics.activeOfficers}
                icon="people"
                color="#FF9800"
              />
              <AnalyticsCard
                title="Avg Response Time"
                value={`${analytics.averageResponseTime}m`}
                icon="time"
                color="#9C27B0"
                trend="-5%"
              />
              <AnalyticsCard
                title="Patrol Efficiency"
                value={`${analytics.patrolEfficiency}%`}
                icon="trending-up"
                color="#00BCD4"
                trend="+3%"
              />
            </View>
          </View>

          {/* Filter Controls */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Filter Data</Text>
            
            <View style={styles.filterContainer}>
              <Text style={styles.filterLabel}>Data Type:</Text>
              <View style={styles.filterButtons}>
                <FilterButton title="All Data" value="all" isActive={filter === 'all'} />
                <FilterButton title="Patrols" value="patrols" isActive={filter === 'patrols'} />
                <FilterButton title="Alerts" value="alerts" isActive={filter === 'alerts'} />
                <FilterButton title="Incidents" value="incidents" isActive={filter === 'incidents'} />
              </View>
            </View>

            <View style={styles.filterContainer}>
              <Text style={styles.filterLabel}>Date Range:</Text>
              <View style={styles.dateButtons}>
                <DateRangeButton title="Today" value="today" isActive={dateRange === 'today'} />
                <DateRangeButton title="This Week" value="week" isActive={dateRange === 'week'} />
                <DateRangeButton title="This Month" value="month" isActive={dateRange === 'month'} />
                <DateRangeButton title="This Year" value="year" isActive={dateRange === 'year'} />
              </View>
            </View>
          </View>

          {/* Report Generation */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Report Generation</Text>
              <TouchableOpacity style={styles.generateButton} onPress={generateReport}>
                <Ionicons name="add-circle" size={20} color="#4CAF50" />
                <Text style={styles.generateButtonText}>Generate</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.generationOptions}>
              <TouchableOpacity style={styles.optionCard}>
                <Ionicons name="document-text" size={24} color="#2196F3" />
                <Text style={styles.optionTitle}>Weekly Summary</Text>
                <Text style={styles.optionDescription}>Comprehensive weekly patrol and incident report</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionCard}>
                <Ionicons name="bar-chart" size={24} color="#4CAF50" />
                <Text style={styles.optionTitle}>Monthly Analysis</Text>
                <Text style={styles.optionDescription}>Detailed monthly performance analytics</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.optionCard}>
                <Ionicons name="settings" size={24} color="#FF9800" />
                <Text style={styles.optionTitle}>Custom Report</Text>
                <Text style={styles.optionDescription}>Create personalized reports with custom parameters</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Recent Reports */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Reports</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {reports.map((report) => (
              <ReportCard key={report.id} report={report} />
            ))}
          </View>

          {/* Export Options */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Export Options</Text>
            
            <View style={styles.exportContainer}>
              <TouchableOpacity style={styles.exportButton}>
                <Ionicons name="document" size={24} color="#F44336" />
                <Text style={styles.exportButtonText}>Export to PDF</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.exportButton}>
                <Ionicons name="grid" size={24} color="#4CAF50" />
                <Text style={styles.exportButtonText}>Export to Excel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.exportButton}>
                <Ionicons name="mail" size={24} color="#2196F3" />
                <Text style={styles.exportButtonText}>Email Report</Text>
              </TouchableOpacity>
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
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 16,
    color: '#4CAF50',
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  analyticsCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendText: {
    fontSize: 12,
    color: '#4CAF50',
    marginLeft: 4,
    fontWeight: 'bold',
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 12,
    color: '#ccc',
  },
  filterContainer: {
    marginBottom: 16,
  },
  filterLabel: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
    fontWeight: '500',
  },
  filterButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  filterButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  filterButtonActive: {
    backgroundColor: '#4CAF50',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#ccc',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: '#fff',
  },
  dateButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dateButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  dateButtonActive: {
    backgroundColor: '#2196F3',
  },
  dateButtonText: {
    fontSize: 12,
    color: '#ccc',
    fontWeight: '500',
  },
  dateButtonTextActive: {
    color: '#fff',
  },
  generateButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  generateButtonText: {
    fontSize: 14,
    color: '#fff',
    marginLeft: 4,
    fontWeight: 'bold',
  },
  generationOptions: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 12,
    flex: 1,
  },
  optionDescription: {
    fontSize: 12,
    color: '#ccc',
    marginLeft: 12,
    flex: 2,
  },
  reportCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  reportPeriod: {
    fontSize: 14,
    color: '#ccc',
  },
  reportStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    color: '#ccc',
    fontWeight: '500',
  },
  reportActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  exportContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  exportButton: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 4,
  },
  exportButtonText: {
    fontSize: 12,
    color: '#fff',
    marginTop: 8,
    fontWeight: '500',
    textAlign: 'center',
  },
});

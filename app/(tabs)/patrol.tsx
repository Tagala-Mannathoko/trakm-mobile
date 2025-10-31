import { useAuth } from '@/contexts/AuthContext';
import { PatrolScan, QRCode, supabase } from '@/utils/supabase';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
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

export default function PatrolScreen() {
  const { user, securityOfficer } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [showScanner, setShowScanner] = useState(false);
  const [patrolComment, setPatrolComment] = useState('');
  const [recentScans, setRecentScans] = useState<PatrolScan[]>([]);
  const [qrCodes, setQrCodes] = useState<QRCode[]>([]);

  useEffect(() => {
    fetchRecentScans();
    fetchQRCodes();
  }, []);

  const fetchRecentScans = async () => {
    if (!securityOfficer) return;

    try {
      const { data, error } = await supabase
        .from('patrol_scans')
        .select(`
          *,
          qr_codes (
            qr_code_value,
            location_description,
            gate_name
          )
        `)
        .eq('officer_id', securityOfficer.officer_id)
        .order('scan_timestamp', { ascending: false })
        .limit(10);

      if (!error) {
        setRecentScans(data || []);
      }
    } catch (error) {
      console.error('Error fetching recent scans:', error);
    }
  };

  const fetchQRCodes = async () => {
    try {
      const { data, error } = await supabase
        .from('qr_codes')
        .select('*')
        .eq('is_active', true);

      if (!error) {
        setQrCodes(data || []);
      }
    } catch (error) {
      console.error('Error fetching QR codes:', error);
    }
  };

  const handleQRCodeScanned = async ({ data }: { data: string }) => {
    setShowScanner(false);
    
    // Find the QR code in our database
    const qrCode = qrCodes.find(qr => qr.qr_code_value === data);
    
    if (!qrCode) {
      Alert.alert('Invalid QR Code', 'This QR code is not recognized in our system.');
      return;
    }

    if (!securityOfficer) {
      Alert.alert('Error', 'Security officer information not found.');
      return;
    }

    try {
      // Create patrol scan record
      const { error } = await supabase
        .from('patrol_scans')
        .insert({
          officer_id: securityOfficer.officer_id,
          qr_code_id: qrCode.qr_code_id,
          comments: patrolComment,
          scan_timestamp: new Date().toISOString(),
        });

      if (error) {
        Alert.alert('Error', 'Failed to record patrol scan.');
        return;
      }

      Alert.alert(
        'Patrol Scan Recorded',
        `Successfully scanned ${qrCode.gate_name || qrCode.location_description}`,
        [
          {
            text: 'OK',
            onPress: () => {
              setPatrolComment('');
              fetchRecentScans();
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to record patrol scan.');
    }
  };

  const startScanning = async () => {
    if (!permission) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Camera Permission', 'Camera permission is required to scan QR codes.');
        return;
      }
    }
    setShowScanner(true);
  };

  const formatScanTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  if (showScanner) {
    return (
      <SafeAreaView style={styles.container}>
        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={handleQRCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        >
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerHeader}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowScanner(false)}
              >
                <Ionicons name="close" size={24} color="#fff" />
              </TouchableOpacity>
              <Text style={styles.scannerTitle}>Scan QR Code</Text>
              <View style={styles.placeholder} />
            </View>
            
            <View style={styles.scannerFrame}>
              <View style={styles.scannerCorner} />
              <View style={[styles.scannerCorner, styles.topRight]} />
              <View style={[styles.scannerCorner, styles.bottomLeft]} />
              <View style={[styles.scannerCorner, styles.bottomRight]} />
            </View>
            
            <Text style={styles.scannerInstruction}>
              Position the QR code within the frame
            </Text>
          </View>
        </CameraView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#1a1a1a', '#2d2d2d']}
        style={styles.gradient}
      >
        <ScrollView style={styles.scrollView}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Patrol Monitoring</Text>
            <Text style={styles.subtitle}>Track your patrol activities</Text>
          </View>

          {/* Patrol Logging Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Patrol Logging</Text>
            
            <View style={styles.commentContainer}>
              <Text style={styles.commentLabel}>Patrol Comments</Text>
              <TextInput
                style={styles.commentInput}
                placeholder="Add comments about your patrol..."
                placeholderTextColor="#666"
                value={patrolComment}
                onChangeText={setPatrolComment}
                multiline
                numberOfLines={3}
              />
            </View>

            <TouchableOpacity style={styles.scanButton} onPress={startScanning}>
              <Ionicons name="qr-code" size={24} color="#fff" />
              <Text style={styles.scanButtonText}>Start QR Scan</Text>
            </TouchableOpacity>
          </View>

          {/* Scan History Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recent Scans</Text>
              <TouchableOpacity>
                <Text style={styles.viewAllText}>View All</Text>
              </TouchableOpacity>
            </View>

            {recentScans.length > 0 ? (
              recentScans.map((scan) => (
                <View key={scan.scan_id} style={styles.scanCard}>
                  <View style={styles.scanHeader}>
                    <View style={styles.scanLocation}>
                      <Ionicons name="location" size={16} color="#4CAF50" />
                      <Text style={styles.scanLocationText}>
                        {scan.qr_codes?.gate_name || scan.qr_codes?.location_description || 'Unknown Location'}
                      </Text>
                    </View>
                    <Text style={styles.scanTime}>
                      {formatScanTime(scan.scan_timestamp)}
                    </Text>
                  </View>
                  
                  {scan.comments && (
                    <Text style={styles.scanComment}>{scan.comments}</Text>
                  )}
                  
                  <View style={styles.scanFooter}>
                    <Text style={styles.scanNumber}>Scan #{scan.scan_id.slice(-6)}</Text>
                    <View style={styles.scanStatus}>
                      <Ionicons name="checkmark-circle" size={16} color="#4CAF50" />
                      <Text style={styles.scanStatusText}>Completed</Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="qr-code-outline" size={48} color="#666" />
                <Text style={styles.emptyStateText}>No recent scans</Text>
                <Text style={styles.emptyStateSubtext}>
                  Start your patrol by scanning QR codes at checkpoints
                </Text>
              </View>
            )}
          </View>

          {/* Patrol Routes Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Patrol Routes</Text>
            
            <View style={styles.routesContainer}>
              <TouchableOpacity style={styles.routeCard}>
                <View style={styles.routeIcon}>
                  <Ionicons name="location" size={24} color="#2196F3" />
                </View>
                <View style={styles.routeInfo}>
                  <Text style={styles.routeName}>Zone A</Text>
                  <Text style={styles.routeDescription}>Main residential area</Text>
                  <Text style={styles.routeStatus}>3 checkpoints</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.routeCard}>
                <View style={styles.routeIcon}>
                  <Ionicons name="location" size={24} color="#FF9800" />
                </View>
                <View style={styles.routeInfo}>
                  <Text style={styles.routeName}>Zone B</Text>
                  <Text style={styles.routeDescription}>Commercial district</Text>
                  <Text style={styles.routeStatus}>5 checkpoints</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.routeCard}>
                <View style={styles.routeIcon}>
                  <Ionicons name="location" size={24} color="#4CAF50" />
                </View>
                <View style={styles.routeInfo}>
                  <Text style={styles.routeName}>Zone C</Text>
                  <Text style={styles.routeDescription}>Park and recreation area</Text>
                  <Text style={styles.routeStatus}>2 checkpoints</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#666" />
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
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 16,
    color: '#4CAF50',
  },
  commentContainer: {
    marginBottom: 20,
  },
  commentLabel: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 8,
  },
  commentInput: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#fff',
    textAlignVertical: 'top',
    minHeight: 80,
  },
  scanButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  scanCard: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  scanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  scanLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  scanLocationText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 8,
  },
  scanTime: {
    fontSize: 14,
    color: '#ccc',
  },
  scanComment: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 12,
    fontStyle: 'italic',
  },
  scanFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scanNumber: {
    fontSize: 12,
    color: '#666',
  },
  scanStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scanStatusText: {
    fontSize: 12,
    color: '#4CAF50',
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
  routesContainer: {
    backgroundColor: '#2a2a2a',
    borderRadius: 12,
    padding: 16,
  },
  routeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  routeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#1a1a1a',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  routeInfo: {
    flex: 1,
  },
  routeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },
  routeDescription: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 4,
  },
  routeStatus: {
    fontSize: 12,
    color: '#4CAF50',
  },
  camera: {
    flex: 1,
  },
  scannerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerHeader: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  closeButton: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  scannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  placeholder: {
    width: 40,
  },
  scannerFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  scannerCorner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: '#4CAF50',
    borderWidth: 3,
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  topRight: {
    top: 0,
    right: 0,
    left: 'auto',
    borderLeftWidth: 0,
    borderRightWidth: 3,
  },
  bottomLeft: {
    bottom: 0,
    top: 'auto',
    borderTopWidth: 0,
    borderBottomWidth: 3,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    top: 'auto',
    left: 'auto',
    borderTopWidth: 0,
    borderLeftWidth: 0,
    borderRightWidth: 3,
    borderBottomWidth: 3,
  },
  scannerInstruction: {
    position: 'absolute',
    bottom: 100,
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

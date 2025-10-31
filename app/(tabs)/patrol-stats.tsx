import { useAuth } from '@/contexts/AuthContext';
// @ts-ignore – utils/supabase exports a runtime client not typed here
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface PatrolStatItem {
	label: string;
	value: number | string;
}

export default function PatrolStatsScreen() {
	const { neighborhoodMember } = useAuth();
	const [totalScans, setTotalScans] = useState(0);
	const [weeklyScans, setWeeklyScans] = useState(0);
	const [lastScanAt, setLastScanAt] = useState<string | null>(null);
	const [loading, setLoading] = useState(true);

	const addressText = useMemo(() => {
		if (!neighborhoodMember) return '';
		const parts = [neighborhoodMember.house_number, neighborhoodMember.street_address].filter(Boolean);
		return parts.join(' ');
	}, [neighborhoodMember]);

	useEffect(() => {
		fetchStats();
	}, [addressText]);

	const fetchStats = async () => {
		try {
			if (!neighborhoodMember) {
				setLoading(false);
				return;
			}

			// Approximation: count patrol scans whose QR code description mentions the member's address
			const sinceWeek = new Date();
			sinceWeek.setDate(sinceWeek.getDate() - 7);

			// Load client lazily to avoid type linting issues
			const { supabase } = require('@/utils/supabase');
			const { data, error } = await (supabase as any)
				.from('patrol_scans')
				.select(`
					*,
					qr_codes (
						location_description
					)
				`)
				.order('scan_timestamp', { ascending: false });

			if (error) {
				console.error('Error fetching patrol stats:', error);
				setLoading(false);
				return;
			}

			const relevant = (data || []).filter((row: any) => {
				const desc = row.qr_codes?.location_description?.toLowerCase?.() || '';
				return addressText ? desc.includes(addressText.toLowerCase()) : false;
			});

			setTotalScans(relevant.length);
			setWeeklyScans(
				relevant.filter((r: any) => new Date(r.scan_timestamp) >= sinceWeek).length
			);
			setLastScanAt(relevant[0]?.scan_timestamp || null);
		} finally {
			setLoading(false);
		}
	};

	const StatCard = ({ label, value, icon, color }: { label: string; value: number | string; icon: string; color: string }) => (
		<View style={styles.statCard}>
			<View style={[styles.iconWrap, { backgroundColor: color }]}>
				<Ionicons name={icon as any} size={20} color="#fff" />
			</View>
			<Text style={styles.statValue}>{value}</Text>
			<Text style={styles.statLabel}>{label}</Text>
		</View>
	);

	return (
		<SafeAreaView style={styles.container}>
			<LinearGradient colors={['#1a1a1a', '#2d2d2d']} style={styles.gradient}>
				<ScrollView style={styles.scroll}>
					<View style={styles.header}>
						<Text style={styles.title}>Patrol Statistics</Text>
						<Text style={styles.subtitle}>
							{addressText ? `For ${addressText}` : 'Add your house to see local patrols'}
						</Text>
					</View>

					<View style={styles.statsRow}>
						<StatCard label="Total Scans Nearby" value={totalScans} icon="walk" color="#2196F3" />
						<StatCard label="This Week" value={weeklyScans} icon="calendar" color="#4CAF50" />
						<StatCard label="Last Scan" value={lastScanAt ? new Date(lastScanAt).toLocaleString() : '—'} icon="time" color="#FF9800" />
					</View>

					<View style={styles.infoBox}>
						<Ionicons name="information-circle" size={20} color="#4CAF50" />
						<Text style={styles.infoText}>
							This view estimates patrol frequency near your address based on checkpoint scans.
						</Text>
					</View>
				</ScrollView>
			</LinearGradient>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	container: { flex: 1 },
	gradient: { flex: 1 },
	scroll: { flex: 1 },
	header: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 12 },
	title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 6 },
	subtitle: { fontSize: 14, color: '#ccc' },
	statsRow: { flexDirection: 'row', paddingHorizontal: 20, marginTop: 12, justifyContent: 'space-between' },
	statCard: { backgroundColor: '#2a2a2a', borderRadius: 12, padding: 16, width: '32%', alignItems: 'center' },
	iconWrap: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
	statValue: { fontSize: 16, color: '#fff', fontWeight: 'bold', textAlign: 'center' },
	statLabel: { fontSize: 12, color: '#ccc', marginTop: 4, textAlign: 'center' },
	infoBox: { marginTop: 24, marginHorizontal: 20, backgroundColor: '#1f1f1f', borderRadius: 12, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
	infoText: { color: '#ccc', marginLeft: 8, flex: 1 },
});



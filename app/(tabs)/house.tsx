import { useAuth } from '@/contexts/AuthContext';
// @ts-ignore – runtime client without local types here
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useMemo, useState } from 'react';
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

export default function HouseScreen() {
	const { neighborhoodMember } = useAuth();
	const [houseNumber, setHouseNumber] = useState('');
	const [streetAddress, setStreetAddress] = useState('');
	const [qrValue, setQrValue] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (neighborhoodMember) {
			setHouseNumber(neighborhoodMember.house_number || '');
			setStreetAddress(neighborhoodMember.street_address || '');
		}
	}, [neighborhoodMember]);

	const computedQrValue = useMemo(() => {
		if (!neighborhoodMember) return null;
		return `house:${neighborhoodMember.member_id}`;
	}, [neighborhoodMember]);

	const saveHouse = async () => {
		try {
			if (!neighborhoodMember) return;
			console.log('[House] Save start', { memberId: neighborhoodMember.member_id, houseNumber, streetAddress });
			if (!houseNumber.trim() || !streetAddress.trim()) {
				Alert.alert('Error', 'Please enter house number and street address');
				return;
			}
			setSaving(true);

			// Update member profile
			console.log('[House] Updating neighborhood_members...');
			const { supabase } = require('@/utils/supabase');
			const { error: memberErr } = await (supabase as any)
				.from('neighborhood_members')
				.update({
					house_number: houseNumber.trim(),
					street_address: streetAddress.trim(),
					updated_at: new Date().toISOString(),
				})
				.eq('member_id', neighborhoodMember.member_id);

			if (memberErr) {
				console.log('[House] Update neighborhood_members error', memberErr);
				Alert.alert('Error', 'Failed to save address');
				setSaving(false);
				return;
			}
			console.log('[House] Updated neighborhood_members successfully');

			// Ensure a QR code exists for this house (idempotent by qr_code_value)
			const value = computedQrValue;
			if (value) {
				console.log('[House] Checking existing qr_codes...', { qr_code_value: value });
				const { data: qrExisting, error: qrSelectErr } = await (supabase as any)
					.from('qr_codes')
					.select('*')
					.eq('qr_code_value', value)
					.limit(1)
					.maybeSingle();

				if (qrSelectErr) {
					console.log('[House] Select qr_codes error', qrSelectErr);
				}
				console.log('[House] Existing qr_codes result', qrExisting);

				if (!qrExisting) {
					console.log('[House] Upserting qr_codes row...');
					const { error: qrInsertErr } = await (supabase as any).from('qr_codes').upsert(
						{
							qr_code_value: value,
							location_description: `${houseNumber.trim()} ${streetAddress.trim()}`,
							is_active: true,
							created_at: new Date().toISOString(),
							updated_at: new Date().toISOString(),
						},
						{ onConflict: 'qr_code_value' }
					);
					if (qrInsertErr) {
						console.log('[House] Insert qr_codes error', qrInsertErr);
						Alert.alert('Error', 'Failed to create QR code');
						setSaving(false);
						return;
					}
					console.log('[House] Inserted qr_codes successfully');
				}
				setQrValue(value);
			}

			console.log('[House] Save complete');
			Alert.alert('Saved', 'Your house and QR code are ready.');
		} catch (e) {
			console.log('[House] Unexpected error', e);
			Alert.alert('Error', 'Failed to save house info');
		} finally {
			setSaving(false);
		}
	};

	return (
		<SafeAreaView style={styles.container}>
			<LinearGradient colors={['#1a1a1a', '#2d2d2d']} style={styles.gradient}>
				<ScrollView style={styles.scroll}>
					<View style={styles.header}>
						<Text style={styles.title}>My House</Text>
						<Text style={styles.subtitle}>Add your address and generate a QR code</Text>
					</View>

					<View style={styles.card}>
						<Text style={styles.label}>House Number</Text>
						<TextInput
							style={styles.input}
							placeholder="e.g. 123"
							placeholderTextColor="#666"
							value={houseNumber}
							onChangeText={setHouseNumber}
						/>

						<Text style={styles.label}>Street Address</Text>
						<TextInput
							style={styles.input}
							placeholder="e.g. Oak Street"
							placeholderTextColor="#666"
							value={streetAddress}
							onChangeText={setStreetAddress}
						/>

						<TouchableOpacity style={styles.saveButton} onPress={saveHouse} disabled={saving}>
							<Ionicons name="save" size={18} color="#fff" />
							<Text style={styles.saveButtonText}>{saving ? 'Saving...' : 'Save & Generate QR'}</Text>
						</TouchableOpacity>
					</View>

					{(qrValue || computedQrValue) && (
						<View style={styles.card}>
							<Text style={styles.label}>Your House QR</Text>
							<Text style={styles.qrValue}>{qrValue || computedQrValue}</Text>
							<Text style={styles.qrHint}>Officers can scan this to record patrols.</Text>
						</View>
					)}
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
	card: { backgroundColor: '#2a2a2a', borderRadius: 12, padding: 16, margin: 20 },
	label: { color: '#fff', marginBottom: 8, fontWeight: '600' },
	input: { backgroundColor: '#1a1a1a', color: '#fff', borderRadius: 8, padding: 12, marginBottom: 16 },
	saveButton: { backgroundColor: '#4CAF50', borderRadius: 10, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
	saveButtonText: { color: '#fff', marginLeft: 8, fontWeight: 'bold' },
	qrValue: { color: '#4CAF50', fontWeight: 'bold', marginTop: 8 },
	qrHint: { color: '#ccc', marginTop: 4 },
});



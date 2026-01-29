import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/Colors';

import { router } from 'expo-router';
import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {


  const handleTestDeepLink = () => {
    Alert.alert(
      '🔗 Test Deep Link',
      'In production/TestFlight, this would open from an external link. For now, we\'ll simulate it by navigating directly.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Test Offer Link',
          onPress: () => {
            // Simulate opening: matchslot://offer/test123
            router.push('/offer/test123' as any);
          }
        }
      ]
    );
  };
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome Coach ⚽</Text>
        <Text style={styles.subtitle}>Schedule football matches with other clubs</Text>
      </View>

      <View style={styles.content}>

        <Card style={styles.ctaCard}>
          <Text style={styles.ctaTitle}>Create a Match Offer</Text>
          <Text style={styles.ctaDesc}>
            Set up your match details, add available time slots, and share with other coaches
          </Text>
          <Button
            title="Create Match Offer"
            onPress={() => router.push('/match/create')}
          />
        </Card>

        <Card style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconText}>⚽</Text>
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>How it works</Text>
              <Text style={styles.infoText}>
                1. Create a match offer with your details{'\n'}
                2. Add multiple time slot options{'\n'}
                3. Share the link with other coaches{'\n'}
                4. Guest teams book and get approval{'\n'}
                5. Match confirmed!
              </Text>
            </View>
          </View>
        </Card>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  content: {
    flex: 1,
    gap: 16,
  },
  testDesc: {
    marginBottom: 8,
  },
  ctaCard: {
    padding: 24,
    alignItems: 'center',
    gap: 12,
  },
  ctaTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.text
  },
  ctaDesc: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 20,
  },
  infoCard: {
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 24,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
});

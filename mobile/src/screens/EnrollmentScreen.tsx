import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { Text, Card, Button, TextInput, Checkbox } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRoute, useNavigation } from '@react-navigation/native';
import { enrollmentsApi, classesApi } from '../services/api';
import { theme, spacing } from '../theme/theme';

type RouteProps = {
  params: {
    classId: string;
  };
};

const EnrollmentScreen = () => {
  const route = useRoute<RouteProps>();
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const { classId } = route.params;

  const [childFirstName, setChildFirstName] = useState('');
  const [childLastName, setChildLastName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [grade, setGrade] = useState('');
  const [medicalInfo, setMedicalInfo] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [autoRenew, setAutoRenew] = useState(true);
  const [termsAccepted, setTermsAccepted] = useState(false);

  const { data: classData } = useQuery({
    queryKey: ['class', classId],
    queryFn: () => classesApi.getClass(classId),
    select: (response) => response.data,
  });

  const enrollmentMutation = useMutation({
    mutationFn: (enrollmentData: any) => enrollmentsApi.createEnrollment(enrollmentData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
      Alert.alert(
        'Enrollment Successful!',
        'Your enrollment has been submitted. You will receive a confirmation email shortly.',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    },
    onError: (error: any) => {
      Alert.alert(
        'Enrollment Failed',
        error.response?.data?.message || 'Please try again later.'
      );
    },
  });

  const handleSubmit = () => {
    if (!childFirstName.trim() || !childLastName.trim() || !dateOfBirth.trim() || !emergencyContact.trim()) {
      Alert.alert('Missing Information', 'Please fill in all required fields.');
      return;
    }

    if (!termsAccepted) {
      Alert.alert('Terms Required', 'Please accept the terms and conditions to proceed.');
      return;
    }

    const enrollmentData = {
      classId,
      childInfo: {
        firstName: childFirstName.trim(),
        lastName: childLastName.trim(),
        dateOfBirth,
        grade: grade.trim(),
        medicalInfo: medicalInfo.trim(),
        emergencyContact: emergencyContact.trim(),
      },
      autoRenew,
    };

    enrollmentMutation.mutate(enrollmentData);
  };

  if (!classData) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loading}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.content}>
        {/* Class Summary */}
        <Card style={styles.summaryCard}>
          <Card.Title title="Enrolling in:" />
          <Card.Content>
            <Text variant="titleLarge" style={styles.className}>
              {classData.name}
            </Text>
            <Text variant="bodyMedium" style={styles.classPrice}>
              ${classData.pricePerTerm} per term
            </Text>
          </Card.Content>
        </Card>

        {/* Child Information */}
        <Card style={styles.formCard}>
          <Card.Title title="Child Information" />
          <Card.Content>
            <TextInput
              label="First Name *"
              value={childFirstName}
              onChangeText={setChildFirstName}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Last Name *"
              value={childLastName}
              onChangeText={setChildLastName}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Date of Birth (YYYY-MM-DD) *"
              value={dateOfBirth}
              onChangeText={setDateOfBirth}
              mode="outlined"
              placeholder="2015-03-15"
              style={styles.input}
            />

            <TextInput
              label="Grade/Year Level"
              value={grade}
              onChangeText={setGrade}
              mode="outlined"
              placeholder="Year 3"
              style={styles.input}
            />

            <TextInput
              label="Medical Information"
              value={medicalInfo}
              onChangeText={setMedicalInfo}
              mode="outlined"
              multiline
              numberOfLines={3}
              placeholder="Any allergies, medical conditions, or special requirements"
              style={styles.input}
            />

            <TextInput
              label="Emergency Contact *"
              value={emergencyContact}
              onChangeText={setEmergencyContact}
              mode="outlined"
              placeholder="Name and phone number"
              style={styles.input}
            />
          </Card.Content>
        </Card>

        {/* Options */}
        <Card style={styles.formCard}>
          <Card.Title title="Enrollment Options" />
          <Card.Content>
            <View style={styles.checkboxRow}>
              <Checkbox
                status={autoRenew ? 'checked' : 'unchecked'}
                onPress={() => setAutoRenew(!autoRenew)}
              />
              <View style={styles.checkboxText}>
                <Text variant="bodyMedium">Auto-renewal for future terms</Text>
                <Text variant="bodySmall" style={styles.checkboxSubtext}>
                  Automatically re-enroll for the next term (you'll be notified 1 month in advance)
                </Text>
              </View>
            </View>

            <View style={styles.checkboxRow}>
              <Checkbox
                status={termsAccepted ? 'checked' : 'unchecked'}
                onPress={() => setTermsAccepted(!termsAccepted)}
              />
              <View style={styles.checkboxText}>
                <Text variant="bodyMedium">I accept the terms and conditions *</Text>
                <Text variant="bodySmall" style={styles.checkboxSubtext}>
                  Including payment terms, cancellation policy, and liability waivers
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Summary */}
        <Card style={styles.summaryCard}>
          <Card.Title title="Enrollment Summary" />
          <Card.Content>
            <View style={styles.summaryRow}>
              <Text variant="bodyMedium">Term Fee:</Text>
              <Text variant="titleMedium" style={styles.summaryPrice}>
                ${classData.pricePerTerm}
              </Text>
            </View>
            
            <Text variant="bodySmall" style={styles.paymentNote}>
              Payment will be processed after enrollment confirmation.
            </Text>
          </Card.Content>
        </Card>

        {/* Submit Button */}
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={enrollmentMutation.isPending}
          disabled={enrollmentMutation.isPending}
          style={styles.submitButton}
          contentStyle={styles.submitButtonContent}
        >
          Submit Enrollment
        </Button>

        <Text variant="bodySmall" style={styles.disclaimer}>
          * Required fields. You will receive a confirmation email with payment instructions.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  summaryCard: {
    marginBottom: spacing.lg,
  },
  className: {
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  classPrice: {
    color: theme.colors.primary,
    fontWeight: 'bold',
  },
  formCard: {
    marginBottom: spacing.lg,
  },
  input: {
    marginBottom: spacing.md,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  checkboxText: {
    flex: 1,
    marginLeft: spacing.sm,
  },
  checkboxSubtext: {
    opacity: 0.7,
    marginTop: spacing.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryPrice: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  paymentNote: {
    opacity: 0.7,
    fontStyle: 'italic',
  },
  submitButton: {
    marginVertical: spacing.xl,
  },
  submitButtonContent: {
    paddingVertical: spacing.sm,
  },
  disclaimer: {
    textAlign: 'center',
    opacity: 0.7,
    marginBottom: spacing.xl,
  },
});

export default EnrollmentScreen;
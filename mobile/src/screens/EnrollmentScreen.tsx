import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { 
  Card, 
  Title, 
  Paragraph, 
  Button, 
  Text,
  TextInput,
  RadioButton
} from 'react-native-paper';
import { useRoute, useNavigation } from '@react-navigation/native';
import { apiService } from '../services/api';

export default function EnrollmentScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { classData } = route.params as { classData: any };
  
  const [selectedChild, setSelectedChild] = useState('new');
  const [childInfo, setChildInfo] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    grade: '',
    medicalInfo: '',
    emergencyContact: '',
  });
  const [loading, setLoading] = useState(false);

  const handleEnroll = async () => {
    if (selectedChild === 'new' && (!childInfo.firstName || !childInfo.lastName || !childInfo.dateOfBirth)) {
      Alert.alert('Error', 'Please fill in all required child information');
      return;
    }

    setLoading(true);
    try {
      const enrollmentData = {
        classId: classData.id,
        childInfo: selectedChild === 'new' ? childInfo : undefined,
      };

      await apiService.enrollInClass(enrollmentData);
      
      Alert.alert(
        'Enrollment Successful!',
        `Your child has been enrolled in ${classData.name}. You will receive a confirmation email shortly.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Enrollment Failed', error.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* Class Summary */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Class Summary</Title>
          <Text style={styles.className}>{classData.name}</Text>
          <Text style={styles.classInfo}>
            {classData.sportType} • Ages {classData.minAge}-{classData.maxAge}
          </Text>
          <Text style={styles.classPrice}>
            ${classData.price} per term
          </Text>
        </Card.Content>
      </Card>

      {/* Child Selection */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Select Child</Title>
          
          <View style={styles.radioOption}>
            <RadioButton
              value="new"
              status={selectedChild === 'new' ? 'checked' : 'unchecked'}
              onPress={() => setSelectedChild('new')}
            />
            <Text style={styles.radioLabel}>Add New Child</Text>
          </View>
        </Card.Content>
      </Card>

      {/* Child Information Form */}
      {selectedChild === 'new' && (
        <Card style={styles.card}>
          <Card.Content>
            <Title style={styles.sectionTitle}>Child Information</Title>
            
            <TextInput
              label="First Name *"
              value={childInfo.firstName}
              onChangeText={(text) => setChildInfo(prev => ({ ...prev, firstName: text }))}
              style={styles.input}
              mode="outlined"
            />
            
            <TextInput
              label="Last Name *"
              value={childInfo.lastName}
              onChangeText={(text) => setChildInfo(prev => ({ ...prev, lastName: text }))}
              style={styles.input}
              mode="outlined"
            />
            
            <TextInput
              label="Date of Birth (YYYY-MM-DD) *"
              value={childInfo.dateOfBirth}
              onChangeText={(text) => setChildInfo(prev => ({ ...prev, dateOfBirth: text }))}
              style={styles.input}
              mode="outlined"
              placeholder="2015-06-15"
            />
            
            <TextInput
              label="Grade (Optional)"
              value={childInfo.grade}
              onChangeText={(text) => setChildInfo(prev => ({ ...prev, grade: text }))}
              style={styles.input}
              mode="outlined"
              placeholder="Grade 3"
            />
            
            <TextInput
              label="Medical Information (Optional)"
              value={childInfo.medicalInfo}
              onChangeText={(text) => setChildInfo(prev => ({ ...prev, medicalInfo: text }))}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={3}
              placeholder="Any allergies, medical conditions, or special requirements..."
            />
            
            <TextInput
              label="Emergency Contact (Optional)"
              value={childInfo.emergencyContact}
              onChangeText={(text) => setChildInfo(prev => ({ ...prev, emergencyContact: text }))}
              style={styles.input}
              mode="outlined"
              placeholder="Name and phone number"
            />
          </Card.Content>
        </Card>
      )}

      {/* Terms and Conditions */}
      <Card style={styles.card}>
        <Card.Content>
          <Title style={styles.sectionTitle}>Terms & Conditions</Title>
          <Paragraph style={styles.termsText}>
            • Full term payment is required at enrollment
          </Paragraph>
          <Paragraph style={styles.termsText}>
            • Refunds are available up to 48 hours before the first session
          </Paragraph>
          <Paragraph style={styles.termsText}>
            • Parents/guardians must sign a waiver before the first session
          </Paragraph>
          <Paragraph style={styles.termsText}>
            • Children must arrive 10 minutes before session start time
          </Paragraph>
          <Paragraph style={styles.termsText}>
            • All equipment is provided, please bring water bottle
          </Paragraph>
        </Card.Content>
      </Card>

      {/* Enrollment Button */}
      <View style={styles.enrollmentSection}>
        <Button
          mode="contained"
          onPress={handleEnroll}
          loading={loading}
          disabled={loading}
          style={styles.enrollButton}
          labelStyle={styles.enrollButtonText}
        >
          Complete Enrollment
        </Button>
        
        <Text style={styles.paymentNote}>
          You will be redirected to secure payment after enrollment
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  card: {
    margin: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    marginBottom: 12,
  },
  className: {
    fontSize: 20,
    fontWeight: '500',
    marginBottom: 4,
  },
  classInfo: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  classPrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  radioLabel: {
    fontSize: 16,
    marginLeft: 8,
  },
  input: {
    marginBottom: 16,
  },
  termsText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  enrollmentSection: {
    margin: 16,
    marginTop: 8,
  },
  enrollButton: {
    paddingVertical: 8,
    marginBottom: 12,
  },
  enrollButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  paymentNote: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    fontStyle: 'italic',
  },
});
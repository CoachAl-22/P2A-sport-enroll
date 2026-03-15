import { parse } from 'csv-parse/sync';
import { storage } from './storage';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';

interface SportsBizStudentRow {
  'First Name': string;
  'Last Name': string;
  'Active': string;
  'DOB': string;
  'Age': string;
  'Gender': string;
  'Reg ID': string;
  'Mobile Phone': string;
  'Email': string;
  'Customer First Name': string;
  'Customer Last Name': string;
  'Customer Type(s)': string;
  'Customer Home Phone': string;
  'Customer Work Phone': string;
  'Customer Mobile Phone 1': string;
  'Customer Mobile Phone 2': string;
  'Customer Fax': string;
  'Customer Email': string;
  'Customer Email 2': string;
  'Address #1': string;
  'Address #2': string;
  'Suburb': string;
  'State': string;
  'Postcode': string;
  'Program': string;
  'Skill Set': string;
  'Referral Source': string;
  'School': string;
  'Medical Conditions': string;
  'Start Date': string;
  'Current Class Count': string;
  'Future Class Count': string;
  'No Invoice Items': string;
  'Price Type': string;
  'Notes': string;
  'School if not in list': string;
  'Year Level': string;
}

function parseDOB(dobStr: string): Date | null {
  if (!dobStr || !dobStr.trim()) return null;
  const parts = dobStr.trim().split('/');
  if (parts.length !== 3) return null;
  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1;
  const year = parseInt(parts[2], 10);
  if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
  return new Date(year, month, day);
}

function normalisePhone(phone: string): string {
  if (!phone) return '';
  return phone.replace(/\s+/g, '').replace(/[^\d+]/g, '').trim();
}

export function isStudentExportFormat(headers: string[]): boolean {
  return headers.includes('Customer First Name') && headers.includes('DOB') && headers.includes('Customer Email');
}

export async function importStudentsFromCSV(csvContent: string, includeInactive = false): Promise<{
  parentsCreated: number;
  parentsExisting: number;
  studentsCreated: number;
  studentsExisting: number;
  skipped: number;
  errors: number;
  errorDetails: string[];
}> {
  const cleanedContent = csvContent.replace(/^\uFEFF/, '');

  const records: SportsBizStudentRow[] = parse(cleanedContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_quotes: true,
    relax_column_count: true,
  });

  const results = {
    parentsCreated: 0,
    parentsExisting: 0,
    studentsCreated: 0,
    studentsExisting: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [] as string[],
  };

  for (const record of records) {
    const studentFirstName = record['First Name']?.trim();
    const studentLastName = record['Last Name']?.trim();
    const isActive = record['Active']?.trim().toUpperCase() === 'TRUE';

    if (!isActive && !includeInactive) {
      results.skipped++;
      continue;
    }

    if (!studentFirstName || !studentLastName) {
      results.skipped++;
      continue;
    }

    const parentFirstName = record['Customer First Name']?.trim();
    const parentLastName = record['Customer Last Name']?.trim();
    const parentEmail = record['Customer Email']?.trim().toLowerCase();
    const parentMobile = normalisePhone(record['Customer Mobile Phone 1']);

    if (!parentFirstName && !parentLastName && !parentEmail && !parentMobile) {
      results.skipped++;
      console.log(`Skipping ${studentFirstName} ${studentLastName} - no parent contact info`);
      continue;
    }

    try {
      // --- Find or create parent ---
      let parent = null;

      if (parentEmail) {
        parent = await storage.getUserByEmail(parentEmail);
      }
      if (!parent && parentMobile) {
        parent = await storage.getUserByMobile(parentMobile);
      }

      if (parent) {
        results.parentsExisting++;
      } else {
        if (!parentEmail && !parentMobile) {
          results.skipped++;
          console.log(`Skipping ${studentFirstName} ${studentLastName} - parent has no email or mobile`);
          continue;
        }

        const hashedPassword = await bcrypt.hash('Power2ADAPT2024!', 10);
        const userId = nanoid(10);

        parent = await storage.createUser({
          firstName: parentFirstName || 'Unknown',
          lastName: parentLastName || 'Unknown',
          email: parentEmail || null,
          mobile: parentMobile || null,
          userId,
          password: hashedPassword,
          role: 'parent' as const,
          active: isActive,
        });

        results.parentsCreated++;
        console.log(`Created parent: ${parentFirstName} ${parentLastName} (${parentEmail || parentMobile})`);
      }

      // --- Find or create child ---
      const existingChildren = await storage.getChildrenByParent(parent.id);
      const childExists = existingChildren.some(
        (c) =>
          c.firstName.toLowerCase() === studentFirstName.toLowerCase() &&
          c.lastName.toLowerCase() === studentLastName.toLowerCase()
      );

      if (childExists) {
        results.studentsExisting++;
        console.log(`Skipping existing child: ${studentFirstName} ${studentLastName}`);
        continue;
      }

      const dob = parseDOB(record['DOB']);
      if (!dob) {
        results.errors++;
        results.errorDetails.push(`${studentFirstName} ${studentLastName}: invalid DOB "${record['DOB']}"`);
        continue;
      }

      const medicalInfo = record['Medical Conditions']?.trim() || null;
      const school = record['School']?.trim() || record['School if not in list']?.trim() || '';
      const yearLevel = record['Year Level']?.trim() || '';
      const grade = yearLevel || (record['Age'] ? `Age ${record['Age']}` : '');
      const program = record['Program']?.trim() || '';

      const notes: string[] = [];
      if (school) notes.push(`School: ${school}`);
      if (program) notes.push(`Program: ${program}`);
      if (record['Referral Source']?.trim()) notes.push(`Referred via: ${record['Referral Source'].trim()}`);
      if (record['Notes']?.trim()) notes.push(record['Notes'].trim());

      await storage.createChild({
        parentId: parent.id,
        firstName: studentFirstName,
        lastName: studentLastName,
        dateOfBirth: dob,
        grade: grade || null,
        medicalInfo: medicalInfo,
        emergencyContact: parentMobile || parentEmail || null,
        active: isActive,
      });

      results.studentsCreated++;
      console.log(`Created student: ${studentFirstName} ${studentLastName} → parent ${parentFirstName} ${parentLastName}`);

    } catch (error: any) {
      results.errors++;
      const msg = `Error processing ${studentFirstName} ${studentLastName}: ${error.message}`;
      results.errorDetails.push(msg);
      console.error(msg);
    }
  }

  return results;
}

export async function previewStudentsFromCSV(csvContent: string): Promise<{
  isStudentFormat: boolean;
  totalRows: number;
  activeRows: number;
  inactiveRows: number;
  parentEmails: Set<string>;
  studentsPreview: any[];
  issues: string[];
}> {
  const cleanedContent = csvContent.replace(/^\uFEFF/, '');

  const records: SportsBizStudentRow[] = parse(cleanedContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_quotes: true,
    relax_column_count: true,
  });

  const headers = Object.keys(records[0] || {});
  const isStudentFormat = isStudentExportFormat(headers);

  const issues: string[] = [];
  const studentsPreview: any[] = [];
  const parentEmails = new Set<string>();
  let activeRows = 0;
  let inactiveRows = 0;

  for (const record of records.slice(0, 500)) {
    const isActive = record['Active']?.trim().toUpperCase() === 'TRUE';
    if (!isActive) { inactiveRows++; continue; }
    activeRows++;

    const studentFirstName = record['First Name']?.trim();
    const studentLastName = record['Last Name']?.trim();
    const parentEmail = record['Customer Email']?.trim().toLowerCase();
    const parentMobile = normalisePhone(record['Customer Mobile Phone 1']);

    if (!studentFirstName || !studentLastName) {
      issues.push(`Row missing student name`);
      continue;
    }

    if (!parseDOB(record['DOB'])) {
      issues.push(`${studentFirstName} ${studentLastName}: unreadable DOB "${record['DOB']}"`);
    }

    if (!parentEmail && !parentMobile) {
      issues.push(`${studentFirstName} ${studentLastName}: no parent email or mobile — will be skipped`);
    }

    if (parentEmail) parentEmails.add(parentEmail);

    studentsPreview.push({
      studentName: `${studentFirstName} ${studentLastName}`,
      dob: record['DOB'],
      gender: record['Gender'],
      program: record['Program'],
      yearLevel: record['Year Level'],
      school: record['School'] || record['School if not in list'],
      medical: record['Medical Conditions'],
      parentName: `${record['Customer First Name']} ${record['Customer Last Name']}`,
      parentEmail,
      parentMobile,
      customerType: record['Customer Type(s)'],
    });
  }

  return {
    isStudentFormat,
    totalRows: records.length,
    activeRows,
    inactiveRows,
    parentEmails,
    studentsPreview,
    issues,
  };
}

export async function importCustomersFromCSV(csvFilePath: string) {
  const { readFileSync } = await import('fs');
  const csvContent = readFileSync(csvFilePath, 'utf-8');
  return importStudentsFromCSV(csvContent);
}

import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';
import { storage } from './storage';
import bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';

interface CSVRow {
  'First Name': string;
  'Last Name': string;
  'Active': string;
  'Gender': string;
  'Customer Type(s)': string;
  'Mobile Phone 1': string;
  'Mobile Phone 2': string;
  'Email': string;
  'Email2': string;
  'Address #1': string;
  'Address #2': string;
  'Suburb': string;
  'State': string;
  'Postcode': string;
  'Notes': string;
}

export async function importCustomersFromCSV(csvFilePath: string) {
  const csvContent = readFileSync(csvFilePath, 'utf-8');
  
  // Remove BOM if present
  const cleanedContent = csvContent.replace(/^\uFEFF/, '');
  
  const records: CSVRow[] = parse(cleanedContent, {
    columns: true,
    skip_empty_lines: true,
  });

  const results = {
    imported: 0,
    skipped: 0,
    errors: 0,
    errorDetails: [] as string[]
  };

  for (const record of records) {
    try {
      // Skip if not active or if it's a trial customer
      if (record.Active !== 'True' || record['Customer Type(s)'].includes('Trials')) {
        results.skipped++;
        continue;
      }

      // Skip if no email or mobile
      const email = record.Email?.trim();
      const mobile = record['Mobile Phone 1']?.replace(/\s+/g, '').trim();
      
      if (!email && !mobile) {
        results.skipped++;
        console.log(`Skipping ${record['First Name']} ${record['Last Name']} - no email or mobile`);
        continue;
      }

      // Check if user already exists
      let existingUser = null;
      if (email) {
        existingUser = await storage.getUserByEmail(email);
      }
      if (!existingUser && mobile) {
        existingUser = await storage.getUserByMobile(mobile);
      }

      if (existingUser) {
        results.skipped++;
        console.log(`Skipping ${record['First Name']} ${record['Last Name']} - user already exists`);
        continue;
      }

      // Create user
      const userId = nanoid(10);
      const defaultPassword = 'Power2ADAPT2024!'; // Users will need to change this on first login
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);

      const userData = {
        firstName: record['First Name'].trim(),
        lastName: record['Last Name'].trim(),
        email: email || null,
        mobile: mobile || null,
        userId: userId,
        password: hashedPassword,
        role: 'parent' as const,
      };

      await storage.createUser(userData);
      results.imported++;
      
      console.log(`Imported: ${record['First Name']} ${record['Last Name']} (${email || mobile})`);

    } catch (error: any) {
      results.errors++;
      const errorMsg = `Error importing ${record['First Name']} ${record['Last Name']}: ${error.message}`;
      results.errorDetails.push(errorMsg);
      console.error(errorMsg);
    }
  }

  return results;
}

export async function createSampleChildrenForParents() {
  // Get all parents without children
  const allUsers = await storage.getAllUsers();
  const parents = allUsers.filter(user => user.role === 'parent');
  
  const results = {
    created: 0,
    errors: 0,
    errorDetails: [] as string[]
  };

  for (const parent of parents) {
    try {
      // Check if parent already has children
      const existingChildren = await storage.getChildrenByParent(parent.id);
      if (existingChildren.length > 0) {
        continue; // Skip if parent already has children
      }

      // Create 1-2 sample children for each parent
      const numChildren = Math.random() > 0.6 ? 2 : 1;
      
      for (let i = 0; i < numChildren; i++) {
        const childFirstNames = ['Emma', 'Noah', 'Olivia', 'Liam', 'Ava', 'William', 'Sophia', 'Mason', 'Isabella', 'James', 'Mia', 'Benjamin', 'Charlotte', 'Jacob', 'Abigail', 'Michael', 'Emily', 'Ethan', 'Harper', 'Alexander'];
        const randomFirstName = childFirstNames[Math.floor(Math.random() * childFirstNames.length)];
        
        // Create birth date for children aged 5-16
        const age = Math.floor(Math.random() * 12) + 5; // Age 5-16
        const birthYear = new Date().getFullYear() - age;
        const birthMonth = Math.floor(Math.random() * 12) + 1;
        const birthDay = Math.floor(Math.random() * 28) + 1;
        const dateOfBirth = new Date(birthYear, birthMonth - 1, birthDay);
        
        // Determine grade based on age
        const grade = age <= 6 ? 'Prep' : 
                     age <= 7 ? 'Year 1' :
                     age <= 8 ? 'Year 2' :
                     age <= 9 ? 'Year 3' :
                     age <= 10 ? 'Year 4' :
                     age <= 11 ? 'Year 5' :
                     age <= 12 ? 'Year 6' :
                     age <= 13 ? 'Year 7' :
                     age <= 14 ? 'Year 8' :
                     age <= 15 ? 'Year 9' :
                     age <= 16 ? 'Year 10' : 'Year 11';

        const childData = {
          parentId: parent.id,
          firstName: randomFirstName,
          lastName: parent.lastName,
          dateOfBirth: dateOfBirth,
          grade: grade,
          medicalInfo: null,
          emergencyContact: parent.mobile || parent.email || null,
        };

        await storage.createChild(childData);
        results.created++;
      }
      
      console.log(`Created ${numChildren} child(ren) for ${parent.firstName} ${parent.lastName}`);

    } catch (error: any) {
      results.errors++;
      const errorMsg = `Error creating children for ${parent.firstName} ${parent.lastName}: ${error.message}`;
      results.errorDetails.push(errorMsg);
      console.error(errorMsg);
    }
  }

  return results;
}
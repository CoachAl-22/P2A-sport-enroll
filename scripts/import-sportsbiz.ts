import { readFileSync } from "fs";
import { storage } from "../server/storage";
import bcrypt from "bcrypt";

async function importSportsBizCustomers() {
  try {
    console.log("Starting SportsBiz customer import...");
    
    // Read the CSV file
    const csvContent = readFileSync("attached_assets/SportsBiz_CustomerExport_1754714208259.csv", "utf-8");
    
    // Parse CSV content
    const lines = csvContent.split('\n').filter(line => line.trim());
    const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
    const dataRows = lines.slice(1).map(line => {
      // Handle CSV parsing with proper quote handling
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    });
    
    console.log(`Found ${headers.length} columns and ${dataRows.length} data rows`);
    console.log("Headers:", headers.slice(0, 10));
    
    let customersImported = 0;
    let customersSkipped = 0;
    let errors = 0;
    
    for (const row of dataRows) {
      try {
        if (row.length !== headers.length) {
          console.log(`Skipping row with ${row.length} columns (expected ${headers.length})`);
          continue;
        }
        
        const rowData: any = {};
        headers.forEach((header, idx) => {
          rowData[header] = row[idx] || '';
        });
        
        const email = rowData['Email'];
        const firstName = rowData['First Name'];
        const lastName = rowData['Last Name'];
        const mobile = rowData['Mobile Phone 1'];
        const isActive = rowData['Active'] === 'True';
        
        // Only import active customers with valid email
        if (isActive && email && firstName && lastName) {
          // Check if user already exists
          const existingUser = await storage.getUserByEmail(email);
          if (!existingUser) {
            // Create new user with default password (they'll need to reset)
            const hashedPassword = await bcrypt.hash('Power2ADAPT2024!', 10);
            
            await storage.createUser({
              email: email,
              mobile: mobile || '',
              firstName: firstName,
              lastName: lastName,
              password: hashedPassword,
              role: 'parent'
            });
            
            customersImported++;
            console.log(`Imported: ${firstName} ${lastName} (${email})`);
          } else {
            customersSkipped++;
            console.log(`Skipped existing: ${firstName} ${lastName} (${email})`);
          }
        } else {
          if (!isActive) {
            customersSkipped++;
          } else {
            console.log(`Skipped invalid data: ${firstName} ${lastName} (${email})`);
          }
        }
      } catch (error) {
        errors++;
        console.error('Error importing customer:', error);
      }
    }
    
    console.log("\n=== Import Summary ===");
    console.log(`✅ Customers imported: ${customersImported}`);
    console.log(`⏭️  Customers skipped: ${customersSkipped}`);
    console.log(`❌ Errors: ${errors}`);
    console.log(`📊 Total processed: ${dataRows.length}`);
    
    return {
      customersImported,
      customersSkipped,
      errors,
      totalProcessed: dataRows.length
    };
    
  } catch (error) {
    console.error('Failed to import SportsBiz customers:', error);
    throw error;
  }
}

// Run the import
importSportsBizCustomers()
  .then((result) => {
    console.log('\n🎉 Import completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Import failed:', error);
    process.exit(1);
  });

export { importSportsBizCustomers };
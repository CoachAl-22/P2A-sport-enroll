// API helper endpoints for admin data access

import { storage } from "./storage";

export async function getAllCustomersWithChildren() {
  try {
    // Get all users with parent role
    const allUsers = await storage.getAllUsers();
    const customers = allUsers.filter(user => user.role === "parent");
    
    // Get all enrollments to find children data
    const allEnrollments = await storage.getAllEnrollmentsWithDetails();
    
    // Create customer objects with their children
    const customersWithChildren = customers.map(customer => {
      const customerEnrollments = allEnrollments.filter(
        (enrollment: any) => enrollment.enrollment?.parentId === customer.id
      );
      
      const children = customerEnrollments.map((enrollment: any) => enrollment.child)
        .filter((child: any, index: number, self: any[]) => 
          child && self.findIndex((c: any) => c.id === child.id) === index
        );
      
      return {
        ...customer,
        children,
        totalEnrollments: customerEnrollments.length,
        activeEnrollments: customerEnrollments.filter((e: any) => e.enrollment?.status === 'active').length
      };
    });
    
    return customersWithChildren;
  } catch (error) {
    console.error('Error fetching customers with children:', error);
    throw error;
  }
}

export async function getAllStudentsWithParents() {
  try {
    const allEnrollments = await storage.getAllEnrollmentsWithDetails();
    
    // Extract unique students with their parent information
    const studentsMap = new Map();
    
    allEnrollments.forEach((enrollment: any) => {
      if (enrollment.child && !studentsMap.has(enrollment.child.id)) {
        const studentEnrollments = allEnrollments.filter(
          (e: any) => e.child?.id === enrollment.child.id
        );
        
        studentsMap.set(enrollment.child.id, {
          ...enrollment.child,
          parent: enrollment.parent,
          totalEnrollments: studentEnrollments.length,
          activeEnrollments: studentEnrollments.filter((e: any) => e.enrollment?.status === 'active').length,
          enrollments: studentEnrollments
        });
      }
    });
    
    return Array.from(studentsMap.values());
  } catch (error) {
    console.error('Error fetching students with parents:', error);
    throw error;
  }
}
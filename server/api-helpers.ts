// API helper endpoints for admin data access

import { storage } from "./storage";

export async function getAllCustomersWithChildren() {
  try {
    // Get all users with parent role
    const allUsers = await storage.getAllUsers();
    const customers = allUsers.filter(user => user.role === "parent");
    
    // Get all children for each customer
    const customersWithChildren = await Promise.all(
      customers.map(async (customer) => {
        try {
          const children = await storage.getChildrenByParent(customer.id);
          const enrollments = await storage.getEnrollmentsByParent(customer.id);
          
          return {
            ...customer,
            children,
            totalEnrollments: enrollments.length,
            activeEnrollments: enrollments.filter((e: any) => e.enrollment?.status === 'active').length
          };
        } catch (error) {
          console.error(`Error fetching data for customer ${customer.id}:`, error);
          return {
            ...customer,
            children: [],
            totalEnrollments: 0,
            activeEnrollments: 0
          };
        }
      })
    );
    
    return customersWithChildren;
  } catch (error) {
    console.error('Error fetching customers with children:', error);
    throw error;
  }
}

export async function getAllStudentsWithParents() {
  try {
    // Get all children from the database
    const allChildren = await storage.getAllChildren();
    
    // Get detailed information for each child
    const studentsWithParents = await Promise.all(
      allChildren.map(async (child: any) => {
        try {
          const parent = await storage.getUser(child.parentId);
          const enrollments = await storage.getEnrollmentsByParent(child.parentId);
          const childEnrollments = enrollments.filter((e: any) => e.child?.id === child.id);
          
          return {
            ...child,
            parent,
            totalEnrollments: childEnrollments.length,
            activeEnrollments: childEnrollments.filter((e: any) => e.enrollment?.status === 'active').length,
            enrollments: childEnrollments
          };
        } catch (error) {
          console.error(`Error fetching data for child ${child.id}:`, error);
          return {
            ...child,
            parent: null,
            totalEnrollments: 0,
            activeEnrollments: 0,
            enrollments: []
          };
        }
      })
    );
    
    return studentsWithParents.filter((student: any) => student.parent !== null);
  } catch (error) {
    console.error('Error fetching students with parents:', error);
    throw error;
  }
}
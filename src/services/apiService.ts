// src/services/apiService.ts
import { Customer, CustomerAnalytics } from "@/types/types";
import { createClient } from '@supabase/supabase-js';

// Read Supabase URL and Anon Key from environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your environment variables.");
  // You might want to throw an error here or handle this case more gracefully
  // For now, we'll proceed, but Supabase client creation will likely fail or use undefined values.
}

export const supabase = createClient(supabaseUrl as string, supabaseAnonKey as string);

// This is the base URL for your *other* backend (non-Supabase)
// It's used in ChatAssistant.tsx
const OTHER_API_BASE_URL = "https://bakend-24ej.onrender.com/api";

export const getCustomers = async (): Promise<Customer[]> => {
  try {
    const { data, error, status } = await supabase
      .from('customers')
      .select('*')
      .order('created_at', { ascending: false }); // Or 'name' if you prefer
    
    if (error && status !== 406) { // 406 can happen if the table is empty, but it's not a fatal error for select
        console.error("Error getting customers:", error);
        throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error("Catch block: Error getting customers:", error);
    throw error;
  }
};

export const searchCustomers = async (query: string): Promise<Customer[]> => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .ilike('name', `%${query}%`) // Make sure 'name' column exists and is text
      .order('name');
    
    if (error) {
        console.error("Error searching customers:", error);
        throw error;
    }
    
    return data || [];
  } catch (error) {
    console.error("Catch block: Error searching customers:", error);
    throw error;
  }
};

// This function uses the OTHER_API_BASE_URL defined for the non-Supabase backend
export const sendChatMessage = async (message: string) => {
  try {
    const response = await fetch(`${OTHER_API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Server responded with status: ${response.status}` }));
      throw new Error(errorData.message || `Failed to send message, server status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error sending chat message:", error);
    throw error;
  }
};

// This function uses the OTHER_API_BASE_URL defined for the non-Supabase backend
export const uploadVisitingCard = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append('card', file);
    
    const response = await fetch(`${OTHER_API_BASE_URL}/upload-card`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Server responded with status: ${response.status}` }));
      throw new Error(errorData.message || `Failed to upload card, server status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error uploading visiting card:", error);
    throw error;
  }
};

// This function uses Supabase
export const createCustomer = async (customerData: Partial<Omit<Customer, 'id' | 'created_at'>>) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .insert([customerData]) // customerData should be an object matching your table structure
      .select(); // .select() will return the inserted rows
    
    if (error) {
      console.error('Supabase createCustomer error object:', JSON.stringify(error, null, 2));
      throw error;
    }
    
    return data?.[0]; // Return the first (and likely only) created customer object
  } catch (error) {
    // This catch block might be redundant if the above one catches it,
    // but good for ensuring all errors are logged.
    console.error("Error creating customer (service):", error);
    throw error;
  }
};

// This function uses Supabase
export const getCustomerCount = async (): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
        console.error("Error getting customer count:", error);
        throw error;
    }
    
    return count || 0;
  } catch (error) {
    console.error("Catch block: Error getting customer count:", error);
    throw error;
  }
};

// This function uses Supabase
export const getDashboardStats = async (): Promise<CustomerAnalytics> => {
  try {
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('company, created_at'); // Only select necessary columns
    
    if (customersError) {
        console.error("Error fetching customers for dashboard stats:", customersError);
        throw customersError;
    }

    const now = new Date();
    const lastMonthStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    
    let newCustomersCount = 0;
    if (customers) {
        newCustomersCount = customers.filter(c => new Date(c.created_at) >= lastMonthStartDate).length;
    }


    const companies: Record<string, number> = {};
    customers?.forEach(customer => {
      const company = customer.company || 'Unknown';
      companies[company] = (companies[company] || 0) + 1;
    });

    const monthlyGrowth: { month: string; count: number }[] = [];
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    for (let i = 5; i >= 0; i--) {
      const targetMonthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = monthNames[targetMonthDate.getMonth()];
      let countForMonth = 0;

      if(customers) {
        countForMonth = customers.filter(c => {
            const createdAtDate = new Date(c.created_at);
            return createdAtDate.getFullYear() === targetMonthDate.getFullYear() &&
                   createdAtDate.getMonth() === targetMonthDate.getMonth();
        }).length;
      }
      monthlyGrowth.push({ month: monthName, count: countForMonth });
    }
    
    // Calculate growth rate (new customers last month / total customers before last month)
    const customersBeforeLastMonth = (customers?.length || 0) - newCustomersCount;
    const growthRate = customersBeforeLastMonth > 0 
      ? (newCustomersCount / customersBeforeLastMonth) * 100
      : (newCustomersCount > 0 ? 100 : 0); // If no prior customers, growth is 100% or 0%

    return {
      totalCustomers: customers?.length || 0,
      newCustomers: newCustomersCount,
      growthRate: parseFloat(growthRate.toFixed(2)), // Round to 2 decimal places
      companyCounts: companies,
      monthlyGrowth
    };
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    throw error;
  }
};

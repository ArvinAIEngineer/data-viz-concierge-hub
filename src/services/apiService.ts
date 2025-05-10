// src/services/apiService.ts
import { Customer, CustomerAnalytics } from "@/types/types";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("Supabase URL or Anon Key is missing. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your environment variables.");
}
export const supabase = createClient(supabaseUrl as string, supabaseAnonKey as string);

const API_BASE_URL = import.meta.env.VITE_CHAT_BACKEND_URL || "https://bakend-24ej.onrender.com";

export const getCustomers = async (query?: string): Promise<Customer[]> => {
  try {
    if (query && query.trim() !== "") {
      const endpoint = `${API_BASE_URL}/api/customers?query=${encodeURIComponent(query)}`;
      console.log(`[API Service] Fetching customers from backend (search query: "${query}"): ${endpoint}`);
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `Server error: ${response.status}` }));
        console.error("[API Service] Error fetching customers from backend:", errorData.message);
        throw new Error(errorData.message || `Failed to fetch customers: ${response.status}`);
      }
      const result = await response.json();
      return result.customers || [];
    } else {
      console.log("[API Service] Fetching ALL customers directly from Supabase for client-side filtering (initial load).");
      const { data, error } = await supabase
        .from('customers')
        .select('id, name, phone_number, email_address, company, gst_number, pan_number, address, created_at')
        .order('name', { ascending: true });
      if (error) {
        console.error("[API Service] Error fetching all customers directly from Supabase:", error);
        throw error;
      }
      return data || [];
    }
  } catch (error) {
    console.error("[API Service] Catch block: Error in getCustomers:", error);
    throw error;
  }
};

export const sendChatMessage = async (message: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Server error: ${response.status}` }));
      throw new Error(errorData.message || `Chat API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("[API Service] Error sending chat message:", error);
    throw error;
  }
};

export const uploadVisitingCard = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append('card', file);
    const response = await fetch(`${API_BASE_URL}/api/upload-card`, {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: `Server error: ${response.status}` }));
      throw new Error(errorData.message || `Card upload API error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("[API Service] Error uploading visiting card:", error);
    throw error;
  }
};

export const createCustomer = async (customerData: Partial<Omit<Customer, 'id' | 'created_at'>>) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/customers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(customerData),
    });

    const responseData = await response.json();

    if (!response.ok || responseData.status !== 'success') {
      console.error('[API Service] Backend createCustomer error:', responseData.message);
      throw new Error(responseData.message || `Failed to create customer: ${response.status}`);
    }
    return responseData.customer_data as Customer; 
  } catch (error) {
    console.error("[API Service] Error creating customer (service via backend):", error);
    throw error;
  }
};

export const getCustomerCount = async (): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true });
    if (error) {
      console.error("[API Service] Error getting customer count:", error);
      throw error;
    }
    return count || 0;
  } catch (error) {
    console.error("[API Service] Catch block: Error getting customer count:", error);
    throw error;
  }
};

export const getDashboardStats = async (): Promise<CustomerAnalytics> => {
  try {
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('company, created_at');
    
    if (customersError) {
        console.error("[API Service] Error fetching customers for dashboard stats:", customersError);
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
    
    const customersBeforeLastMonth = (customers?.length || 0) - newCustomersCount;
    const growthRate = customersBeforeLastMonth > 0 
      ? (newCustomersCount / customersBeforeLastMonth) * 100
      : (newCustomersCount > 0 ? 100 : 0);

    return {
      totalCustomers: customers?.length || 0,
      newCustomers: newCustomersCount,
      growthRate: parseFloat(growthRate.toFixed(2)),
      companyCounts: companies,
      monthlyGrowth
    };
  } catch (error) {
    console.error("[API Service] Error getting dashboard stats:", error);
    throw error;
  }
};

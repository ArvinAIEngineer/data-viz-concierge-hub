
import { Customer, CustomerAnalytics } from "@/types/types";
import { createClient } from '@supabase/supabase-js';

// Using the provided connection string
// Note: Exposing credentials in code is not recommended for production
const supabaseUrl = 'https://rntkfuowrlnbtvwwbgae.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJudGtmdW93cmxuYnR2d3diZ2FlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MTU3MjY5MDEsImV4cCI6MjAzMTMwMjkwMX0.1FQiEZ_Jn4Ly3XPCk51bZHyI9j5YPNBfE6GaNqGPe8A';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// This would be replaced with your actual API base URL
const API_BASE_URL = "http://localhost:5000/api";

export const searchCustomers = async (query: string): Promise<Customer[]> => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .ilike('name', `%${query}%`)
      .order('name');
    
    if (error) throw error;
    
    return data || [];
  } catch (error) {
    console.error("Error searching customers:", error);
    throw error;
  }
};

export const sendChatMessage = async (message: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/chatbot`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to send message to chatbot');
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error sending chat message:", error);
    throw error;
  }
};

export const uploadVisitingCard = async (file: File) => {
  try {
    const formData = new FormData();
    formData.append('card', file);
    
    const response = await fetch(`${API_BASE_URL}/upload-card`, {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error('Failed to upload visiting card');
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error uploading visiting card:", error);
    throw error;
  }
};

export const createCustomer = async (customerData: Partial<Customer>) => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .insert([customerData])
      .select();
    
    if (error) throw error;
    
    return data?.[0];
  } catch (error) {
    console.error("Error creating customer:", error);
    throw error;
  }
};

export const getDashboardStats = async (): Promise<CustomerAnalytics> => {
  try {
    // Get total customers
    const { data: customers, error: customersError } = await supabase
      .from('customers')
      .select('*');
    
    if (customersError) throw customersError;

    // Get new customers in the last month
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthString = lastMonth.toISOString();
    
    const { data: newCustomers, error: newCustomersError } = await supabase
      .from('customers')
      .select('*')
      .gte('created_at', lastMonthString);
    
    if (newCustomersError) throw newCustomersError;

    // Calculate company distribution
    const companies: Record<string, number> = {};
    customers?.forEach(customer => {
      const company = customer.company || 'Unknown';
      companies[company] = (companies[company] || 0) + 1;
    });

    // Calculate monthly growth for the last 6 months
    const monthlyGrowth = [];
    for (let i = 5; i >= 0; i--) {
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - i);
      startDate.setDate(1);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + 1);
      endDate.setDate(0);
      endDate.setHours(23, 59, 59, 999);

      // Get the count for this month
      const { count, error: monthError } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startDate.toISOString())
        .lt('created_at', endDate.toISOString());
      
      if (monthError) throw monthError;

      const monthName = new Date(startDate).toLocaleString('default', { month: 'short' });
      monthlyGrowth.push({
        month: monthName,
        count: count || 0
      });
    }

    // Calculate growth rate compared to previous month
    const twoMonthsAgo = new Date();
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);
    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    
    const { data: prevMonthCustomers, error: prevMonthError } = await supabase
      .from('customers')
      .select('*')
      .gte('created_at', twoMonthsAgo.toISOString())
      .lt('created_at', oneMonthAgo.toISOString());
    
    if (prevMonthError) throw prevMonthError;
    
    const growthRate = prevMonthCustomers && prevMonthCustomers.length > 0 
      ? ((newCustomers?.length || 0) - prevMonthCustomers.length) / prevMonthCustomers.length * 100
      : 0;

    return {
      totalCustomers: customers?.length || 0,
      newCustomers: newCustomers?.length || 0,
      growthRate,
      companyCounts: companies,
      monthlyGrowth
    };
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    throw error;
  }
};

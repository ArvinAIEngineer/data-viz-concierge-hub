
import { Customer } from "@/types/types";

// This would be replaced with your actual API base URL
const API_BASE_URL = "http://localhost:5000/api";

export const searchCustomers = async (query: string): Promise<Customer[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/customers/search?q=${encodeURIComponent(query)}`);
    
    if (!response.ok) {
      throw new Error('Failed to search customers');
    }
    
    return await response.json();
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
    const response = await fetch(`${API_BASE_URL}/customers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(customerData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create customer');
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error creating customer:", error);
    throw error;
  }
};

export const getDashboardStats = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/dashboard/stats`);
    
    if (!response.ok) {
      throw new Error('Failed to get dashboard statistics');
    }
    
    return await response.json();
  } catch (error) {
    console.error("Error getting dashboard stats:", error);
    throw error;
  }
};

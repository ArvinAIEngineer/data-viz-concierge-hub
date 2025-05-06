// src/components/chat/ChatAssistant.tsx
import { useState, useRef } from "react";
import { Send, X, Upload, User } from "lucide-react";
import { createCustomer } from "@/services/apiService";
import { Customer } from "@/types/types";
import { queryClient } from "@/App"; // This import relies on the named export from App.tsx

// ... (rest of the ChatAssistant.tsx code as provided in the previous correct version)
// Ensure the handleSubmit function within CustomerOnboardingForm uses queryClient.invalidateQueries
// as shown before.

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: string;
  customerData?: any;
  extractedData?: any;
  status?: string;
}

interface ChatAssistantProps {
  onClose: () => void;
}

const API_BASE_URL_CHAT = "https://bakend-24ej.onrender.com"; 

const ChatAssistant = ({ onClose }: ChatAssistantProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "I'm here to help! Try something like 'Find customer Acme Corporation' or ask me about GST or customer onboarding.",
      isUser: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const handleSendMessage = async () => {
    if (!inputMessage.trim() && uploadedFiles.length === 0) return;
    
    const newUserMessage: Message = {
      id: messages.length + 1,
      text: inputMessage,
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, newUserMessage]);
    setIsLoading(true);
    
    try {
      if (uploadedFiles.length > 0) {
        await handleCardUpload(uploadedFiles[0]);
        setUploadedFiles([]);
      } else {
        const response = await sendMessageToBackend(inputMessage);
        
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          text: response.reply,
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          customerData: response.customer_data,
          extractedData: response.extracted_data,
          status: response.status
        }]);
        
        if (response.status === "not_found" && inputMessage.toLowerCase().includes("find customer")) {
          setTimeout(() => {
            setMessages(prev => [...prev, {
              id: prev.length + 1,
              text: "This customer does not exist. To create a new customer, please have the following ready:\n\n• GST Number\n• PAN Number\n• Soft copies of ID Proofs",
              isUser: false,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            }]);
          }, 500);
        }
      }
    } catch (error) {
      console.error("Error sending message:", error);
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        text: "Sorry, I encountered an error communicating with the server. Please try again later.",
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setIsLoading(false);
      setInputMessage("");
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleCreateNewCustomer = () => {
    setShowForm(true);
  };

  const handleCardUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('card', file);
    
    try {
      const response = await fetch(`${API_BASE_URL_CHAT}/api/upload-card`, { 
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || "Failed to process card");
      }
      
      const responseText = data.match_status === "existing_match" 
        ? `Found matching customer in the database:\n\nName: ${data.matched_customer?.name || 'N/A'}\nCompany: ${data.matched_customer?.company || 'N/A'}\nGST: ${data.matched_customer?.gst_number || 'N/A'}\nEmail: ${data.matched_customer?.email_address || 'N/A'}`
        : `Extracted information from card:\n\nName: ${data.extracted_data?.name || 'N/A'}\nCompany: ${data.extracted_data?.company || 'N/A'}\nPhone: ${data.extracted_data?.phone_number || 'N/A'}\nEmail: ${data.extracted_data?.email_address || 'N/A'}\nGST: ${data.extracted_data?.gst_number || 'N/A'}\nPAN: ${data.extracted_data?.pan_number || 'N/A'}`;
      
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        text: responseText,
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        customerData: data.matched_customer,
        extractedData: data.extracted_data,
        status: data.match_status
      }]);
      
      if (data.match_status === "new_potential") {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: prev.length + 1,
            text: "Would you like to create a new customer with this information?",
            isUser: false,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]);
        }, 500);
      }
    } catch (error) {
      console.error("Error uploading card:", error);
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        text: `Failed to process the card. Error: ${error instanceof Error ? error.message : "Unknown error"}`,
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    }
  };

  const sendMessageToBackend = async (message: string) => {
    try {
      const response = await fetch(`${API_BASE_URL_CHAT}/api/chat`, { 
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });
      
      if (!response.ok) {
        throw new Error(`Server responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error communicating with backend:', error);
      throw error;
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadedFiles(Array.from(e.target.files));
      setTimeout(() => {
        handleSendMessage();
      }, 100);
    }
  };
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="chat-container">
      <div className="chat-header">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white/20 p-2 rounded-full">
              <User size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-medium">JIA Assistant</h3>
              <p className="text-xs text-white/80">Customer Database Assistant</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white/20 p-1 rounded-full">
            <X size={20} />
          </button>
        </div>
      </div>
      
      <div className="chat-messages">
        {messages.map((message) => (
          <div key={message.id} className={`chat-message ${message.isUser ? 'user' : 'bot'}`}>
            {!message.isUser && (
              <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center">
                <User size={14} className="text-white" />
              </div>
            )}
            <div className={`chat-bubble ${message.isUser ? 'user' : 'bot'}`}>
              <div className="whitespace-pre-wrap">{message.text}</div>
              <div className="text-xs opacity-70 mt-1">{message.timestamp}</div>
            </div>
            {message.isUser && (
              <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center">
                <User size={14} className="text-gray-600" />
              </div>
            )}
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-center my-2">
            <div className="bg-gray-200 px-3 py-1 rounded-full animate-pulse">
              <span className="text-xs text-gray-500">Assistant is typing...</span>
            </div>
          </div>
        )}
        
        {messages.some(m => m.text.includes("This customer does not exist") || 
                         (m.status === "new_potential" && !showForm)) && (
          <div className="mt-4">
            <button 
              onClick={handleCreateNewCustomer}
              className="bg-mdm-primary text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Create New Customer
            </button>
          </div>
        )}
        
        {showForm && (
          <CustomerOnboardingForm 
            onCancel={() => setShowForm(false)} 
            prefillData={messages.find(m => m.extractedData)?.extractedData}
          />
        )}
      </div>
      
      <div className="chat-input-container">
        <div className="relative">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search for a customer..."
            className="chat-input pr-24"
            disabled={isLoading}
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-2">
            <button
              onClick={handleUploadClick}
              className="text-gray-500 hover:text-mdm-primary p-2"
              disabled={isLoading}
              title="Upload visiting card"
            >
              <Upload size={16} />
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,.pdf"
                className="hidden"
              />
            </button>
            <button
              onClick={handleSendMessage}
              className="bg-mdm-primary text-white p-2 rounded-full"
              disabled={isLoading}
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface CustomerOnboardingFormProps {
  onCancel: () => void;
  prefillData?: any;
}

type NewCustomerFormData = Omit<Customer, 'id' | 'created_at'>;


const CustomerOnboardingForm = ({ onCancel, prefillData }: CustomerOnboardingFormProps) => {
  const [formData, setFormData] = useState<NewCustomerFormData>({
    name: prefillData?.name || "",
    company: prefillData?.company || "",
    gst_number: prefillData?.gst_number || "",
    pan_number: prefillData?.pan_number || "",
    address: prefillData?.address || "",
    contact_person: prefillData?.contact_person || prefillData?.name || "",
    email_address: prefillData?.email_address || "",
    phone_number: prefillData?.phone_number || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submissionStatus, setSubmissionStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    const requiredFields: { field: keyof NewCustomerFormData, label: string }[] = [
      { field: 'name', label: 'Customer Name' },
      { field: 'gst_number', label: 'GST Number' },
      { field: 'pan_number', label: 'PAN Number' },
      { field: 'address', label: 'Address' }
    ];
    
    requiredFields.forEach(({ field, label }) => {
      const value = formData[field];
      if (typeof value !== 'string' || !value.trim()) {
        newErrors[field] = `${label} is required`;
      }
    });
    
    if (formData.gst_number && !/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}$/i.test(formData.gst_number)) {
      newErrors.gst_number = "Invalid GST format (e.g. 27AADCA0425P1Z7)";
    }
    
    if (formData.pan_number && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(formData.pan_number)) {
      newErrors.pan_number = "Invalid PAN format (e.g. AADCA0425P)";
    }
    
    if (formData.email_address && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email_address)) {
      newErrors.email_address = "Invalid email format";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    setSubmissionStatus(null);
    
    try {
      const customerToCreate: NewCustomerFormData = {
        name: formData.name,
        phone_number: formData.phone_number || "", 
        email_address: formData.email_address || "",
        company: formData.company || "",
        gst_number: formData.gst_number,
        pan_number: formData.pan_number,
        address: formData.address,
        contact_person: formData.contact_person || "",
      };

      await createCustomer(customerToCreate); 
      
      setSubmissionStatus({
        type: 'success',
        message: `Customer ${formData.name} created successfully!`
      });
      
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customerCount'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
      
      setTimeout(() => {
        onCancel(); 
      }, 2000);

    } catch (error) {
      let errorMessage = "An unexpected error occurred";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'object' && error !== null && 'message' in error && typeof (error as {message: string}).message === 'string') {
        errorMessage = (error as {message: string}).message;
      }
      
      setSubmissionStatus({
        type: 'error',
        message: `Failed to create customer: ${errorMessage}`
      });
      console.error("Error creating customer in form:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-blue-50 p-4 rounded-lg mt-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium">New Customer Onboarding</h3>
        <button onClick={onCancel} className="text-gray-500">
          <X size={16} />
        </button>
      </div>
      
      {submissionStatus && (
        <div className={`mb-4 p-2 rounded ${submissionStatus.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {submissionStatus.message}
        </div>
      )}
      
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">GST Number <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              name="gst_number"
              value={formData.gst_number}
              onChange={handleChange}
              placeholder="e.g. 27AADCA0425P1Z7"
              className={`w-full p-2 border rounded text-sm ${errors.gst_number ? 'border-red-500' : ''}`}
            />
            {errors.gst_number && <p className="text-red-500 text-xs mt-1">{errors.gst_number}</p>}
          </div>
          <div>
            <label className="block text-sm mb-1">PAN Number <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              name="pan_number"
              value={formData.pan_number}
              onChange={handleChange}
              placeholder="e.g. AADCA0425P"
              className={`w-full p-2 border rounded text-sm ${errors.pan_number ? 'border-red-500' : ''}`}
            />
            {errors.pan_number && <p className="text-red-500 text-xs mt-1">{errors.pan_number}</p>}
          </div>
        </div>
        
        <div>
          <label className="block text-sm mb-1">Customer Name <span className="text-red-500">*</span></label>
          <input 
            type="text" 
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter full legal name"
            className={`w-full p-2 border rounded text-sm ${errors.name ? 'border-red-500' : ''}`}
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>
        
        <div>
          <label className="block text-sm mb-1">Company</label>
          <input 
            type="text" 
            name="company"
            value={formData.company}
            onChange={handleChange}
            placeholder="Enter company name (if different from customer name)"
            className="w-full p-2 border rounded text-sm"
          />
        </div>
        
        <div>
          <label className="block text-sm mb-1">Address <span className="text-red-500">*</span></label>
          <textarea 
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="Enter complete address"
            className={`w-full p-2 border rounded text-sm ${errors.address ? 'border-red-500' : ''}`}
            rows={2}
          ></textarea>
          {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-1">Contact Person</label>
            <input 
              type="text" 
              name="contact_person"
              value={formData.contact_person || ""}
              onChange={handleChange}
              placeholder="Name"
              className="w-full p-2 border rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input 
              type="email" 
              name="email_address"
              value={formData.email_address}
              onChange={handleChange}
              placeholder="email@example.com"
              className={`w-full p-2 border rounded text-sm ${errors.email_address ? 'border-red-500' : ''}`}
            />
            {errors.email_address && <p className="text-red-500 text-xs mt-1">{errors.email_address}</p>}
          </div>
          <div>
            <label className="block text-sm mb-1">Phone</label>
            <input 
              type="tel" 
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              placeholder="+91 9876543210"
              className="w-full p-2 border rounded text-sm"
            />
          </div>
        </div>
        
        <div>
          <p className="text-sm font-medium mb-2">Required Documents</p>
          
          <div className="space-y-3">
            <div>
              <label className="block text-sm mb-1">GST Certificate <span className="text-red-500">*</span></label>
              <button 
                type="button" 
                className="w-full p-2 border rounded text-sm flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100"
              >
                <Upload size={14} />
                <span>Upload PDF or Image (Max 5MB)</span>
              </button>
            </div>
            
            <div>
              <label className="block text-sm mb-1">PAN Card <span className="text-red-500">*</span></label>
              <button 
                type="button" 
                className="w-full p-2 border rounded text-sm flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100"
              >
                <Upload size={14} />
                <span>Upload PDF or Image (Max 5MB)</span>
              </button>
            </div>
            
            <div>
              <label className="block text-sm mb-1">Additional ID Proof (Optional)</label>
              <button 
                type="button" 
                className="w-full p-2 border rounded text-sm flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100"
              >
                <Upload size={14} />
                <span>Upload PDF or Image (Max 5MB)</span>
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3">
          <button 
            type="button" 
            onClick={onCancel}
            className="px-4 py-2 border rounded text-sm"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button 
            type="submit"
            className="px-4 py-2 bg-mdm-primary text-white rounded text-sm"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Customer'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatAssistant;

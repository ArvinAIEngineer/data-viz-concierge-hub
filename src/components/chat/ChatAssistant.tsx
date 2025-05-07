import { useState, useRef, useEffect } from "react";
import { Send, X, Upload, User } from "lucide-react";
import { createCustomer } from "@/services/apiService";
import { Customer } from "@/types/types";
import { queryClient } from "@/App";

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: string;
  customerData?: any;
  extractedData?: any;
  status?: string;
  imageDataUrl?: string;
}

interface ChatAssistantProps {
  onClose: () => void;
}

const API_BASE_URL_CHAT = import.meta.env.VITE_CHAT_BACKEND_URL || "https://bakend-24ej.onrender.com";

const ChatAssistant = ({ onClose }: ChatAssistantProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "I'm here to help! Try 'Find customer [name/GST]' or 'Add customer [details]'. You can also upload a visiting card.",
      isUser: false,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: "greeting"
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const convertToJPEG = (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }

      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        canvas.toBlob((blob) => {
          if (blob) {
            const convertedFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(convertedFile);
          } else {
            reject(new Error('Failed to convert image to JPEG'));
          }
        }, 'image/jpeg', 0.9);
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  const sendMessageToChatBackend = async (messageText: string) => {
    try {
      const response = await fetch(`${API_BASE_URL_CHAT}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageText }),
      });
      const responseData = await response.json();
      if (!response.ok) {
        const errorMsg = responseData?.message || responseData?.error || `Server error: ${response.status}`;
        throw new Error(errorMsg);
      }
      return responseData;
    } catch (error) {
      console.error('Error communicating with chat backend:', error);
      throw error instanceof Error ? error : new Error("Failed to communicate with chat service.");
    }
  };

  const handleSendMessage = async () => {
    const currentInput = inputMessage.trim();
    const currentFiles = [...uploadedFiles];

    if (!currentInput && currentFiles.length === 0) return;

    setIsLoading(true);

    if (currentInput) {
      const newUserMessage: Message = {
        id: Date.now(),
        text: currentInput,
        isUser: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, newUserMessage]);
      setInputMessage("");
    }

    try {
      if (currentFiles.length > 0 && currentFiles[0]) {
        await handleCardUpload(currentFiles[0]);
        setUploadedFiles([]);
      } else if (currentInput) {
        const backendResponse = await sendMessageToChatBackend(currentInput);
        
        console.log("Backend response to /api/chat:", JSON.stringify(backendResponse, null, 2));

        setMessages(prev => [...prev, {
          id: Date.now() + 1,
          text: backendResponse.message || "Received an empty response.",
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          customerData: backendResponse.customer_data || null,
          extractedData: backendResponse.extracted_data || null,
          status: backendResponse.status || "unknown"
        }]);
      }
    } catch (error) {
      console.error("Error in handleSendMessage:", error);
      setMessages(prev => [...prev, {
        id: Date.now() + 2,
        text: `Error: ${error instanceof Error ? error.message : "An unexpected error occurred."}`,
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: "error_response"
      }]);
    } finally {
      setIsLoading(false);
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
    console.log("Original file details:", {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    });

    let convertedFile: File;
    try {
      convertedFile = await convertToJPEG(file);
      console.log("Converted file details:", {
        name: convertedFile.name,
        size: convertedFile.size,
        type: convertedFile.type,
        lastModified: convertedFile.lastModified
      });
    } catch (error) {
      console.error("Error converting image to JPEG:", error);
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: `Error: Failed to convert image ${file.name} to JPEG.`,
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: "error_image_conversion"
      }]);
      setIsLoading(false);
      return;
    }

    let base64: string;
    try {
      base64 = await getBase64(convertedFile);
      console.log("Converted file base64 (first 100 chars):", base64.substring(0, 100));
    } catch (error) {
      console.error("Error getting base64:", error);
      base64 = "";
    }

    const userVisualConfirmationMessage: Message = {
      id: Date.now() - 1,
      text: `Processing uploaded card: ${convertedFile.name}`,
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      imageDataUrl: base64
    };
    setMessages(prev => [...prev, userVisualConfirmationMessage]);

    try {
      const formData = new FormData();
      formData.append("card", convertedFile);

      const response = await fetch(`${API_BASE_URL_CHAT}/api/upload-card`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || data.error || `Failed to process card: ${response.status}`);
      }
      
      let responseText = data.message || "Card processed.";

      if (data.status === "existing_customer_card" && data.matched_customer) {
        responseText = `This card seems to match an existing customer:\nName: ${data.matched_customer.name || 'N/A'}\nCompany: ${data.matched_customer.company || 'N/A'}\nGST: ${data.matched_customer.gst_number || 'N/A'}\nPAN: ${data.matched_customer.pan_number || 'N/A'}\nEmail: ${data.matched_customer.email_address || 'N/A'}\nPhone: ${data.matched_customer.phone_number || 'N/A'}\nAddress: ${data.matched_customer.address || 'N/A'}`;
      } else if (data.status === "new_customer_card" && data.extracted_data) {
        responseText = "Extracted details from card for a new potential customer:\n";
        for (const [key, value] of Object.entries(data.extracted_data)) {
          if (value) responseText += `${key.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}: ${value}\n`;
        }
        responseText += "\nWould you like to create a new customer with this information?";
      } else if (data.status === "extraction_failed_card") {
        responseText = `Could not extract structured details. Raw text: \n${data.raw_text?.substring(0, 200) || "No text extracted."}...`;
      } else if (data.status === "error") {
        responseText = `${data.message}\nRaw text: ${data.raw_text?.substring(0, 200) || "No text extracted."}`;
      }

      setMessages(prev => [...prev, {
        id: Date.now(),
        text: responseText,
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        customerData: data.matched_customer || null,
        extractedData: data.extracted_data || null,
        status: data.status || "card_processed"
      }]);
      
    } catch (error) {
      console.error("Error uploading card:", error);
      setMessages(prev => [...prev, {
        id: Date.now(),
        text: `Failed to process card: ${error instanceof Error ? error.message : "Unknown error"}`,
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: "upload_error"
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setUploadedFiles([file]);
      setInputMessage(`Uploading: ${file.name}`);
      setTimeout(() => {
        handleSendMessage();
      }, 100);
    }
  };

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const shouldShowCreateButton = messages.some(msg => {
    const textForMatching = typeof msg.text === 'string' ? msg.text.toLowerCase() : '';
    const statusMatch = msg.status === "new_potential_chat" || 
                       msg.status === "new_customer_card" ||
                       msg.status === "not_found";
    
    const botSuggestsCreation = textForMatching.includes("new customer") ||
                               textForMatching.includes("add them") ||
                               textForMatching.includes("create a new customer");

    return !msg.isUser && (statusMatch || botSuggestsCreation) && !showForm;
  });

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
              <div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center shrink-0">
                <User size={14} className="text-white" />
              </div>
            )}
            <div className={`chat-bubble ${message.isUser ? 'user' : 'bot'}`}>
              {message.imageDataUrl && (
                <img src={message.imageDataUrl} alt="Uploaded card" className="max-w-xs mb-2 rounded" />
              )}
              <div className="whitespace-pre-wrap">{message.text}</div>
              <div className="text-xs opacity-70 mt-1">{message.timestamp}</div>
            </div>
            {message.isUser && (
              <div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center shrink-0">
                <User size={14} className="text-gray-600" />
              </div>
            )}
          </div>
        ))}
        <div ref={messagesEndRef} />
        
        {isLoading && (
          <div className="flex justify-center my-2">
            <div className="bg-gray-200 px-3 py-1 rounded-full animate-pulse">
              <span className="text-xs text-gray-500">Assistant is thinking...</span>
            </div>
          </div>
        )}
        
        {shouldShowCreateButton && (
          <div className="mt-4 p-2 flex justify-center">
            <button 
              onClick={handleCreateNewCustomer}
              className="bg-mdm-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-mdm-primary/90"
            >
              Create New Customer
            </button>
          </div>
        )}
        
        {showForm && (
          <CustomerOnboardingForm 
            onCancel={() => setShowForm(false)} 
            prefillData={messages.slice().reverse().find(m => !m.isUser && m.extractedData)?.extractedData}
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
            placeholder="Search or describe customer details..."
            className="chat-input pr-24"
            disabled={isLoading}
          />
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
            <button
              onClick={handleUploadClick}
              className="text-gray-500 hover:text-mdm-primary p-2 rounded-full hover:bg-gray-100"
              disabled={isLoading}
              title="Upload visiting card"
            >
              <Upload size={18} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={handleSendMessage}
              className="bg-mdm-primary text-white p-2 rounded-full hover:bg-mdm-primary/90 disabled:opacity-50"
              disabled={isLoading || (!inputMessage.trim() && uploadedFiles.length === 0)}
            >
              <Send size={18} />
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
    email_address: prefillData?.email_address || "",
    phone_number: prefillData?.phone_number || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submissionStatus, setSubmissionStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const requiredFields: { field: keyof NewCustomerFormData, label: string }[] = [
      { field: 'name', label: 'Customer Name' },
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
    if (formData.email_address && formData.email_address.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email_address)) {
      newErrors.email_address = "Invalid email format";
    }
    if (formData.phone_number && !/^\+?\d{10,15}$/.test(formData.phone_number.replace(/\D/g, ''))) {
      newErrors.phone_number = "Invalid phone number (10-15 digits)";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmissionStatus(null);

    try {
      const customerToCreate: NewCustomerFormData = {
        name: formData.name,
        phone_number: formData.phone_number || "",
        email_address: formData.email_address || "",
        company: formData.company || "",
        gst_number: formData.gst_number || "",
        pan_number: formData.pan_number || "",
        address: formData.address || "",
      };

      const result = await createCustomer(customerToCreate);

      setSubmissionStatus({
        type: 'success',
        message: `Customer "${formData.name}" created successfully!`
      });

      queryClient.invalidateQueries({ queryKey: ['customers'] });
      queryClient.invalidateQueries({ queryKey: ['customerCount'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });

      setTimeout(() => {
        onCancel();
      }, 2000);
    } catch (error) {
      let errorMessage = "An unexpected error occurred while creating the customer.";
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
    <div className="bg-blue-50 p-4 rounded-lg mt-4 text-sm">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-medium text-base text-gray-800">Add New Customer</h3>
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
          <X size={18} />
        </button>
      </div>

      {submissionStatus && (
        <div className={`mb-4 p-3 rounded-md text-xs ${
          submissionStatus.type === 'success' 
            ? 'bg-green-100 text-green-700 border border-green-200' 
            : 'bg-red-100 text-red-700 border border-red-200'
        }`}>
          {submissionStatus.message}
        </div>
      )}

      <form className="space-y-4" onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Customer Name <span className="text-red-500">*</span></label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g. John Doe"
              className={`w-full p-2 border rounded-md text-sm ${errors.name ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-mdm-primary`}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Company</label>
            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              placeholder="e.g. ACME Corp"
              className={`w-full p-2 border rounded-md text-sm ${errors.company ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-mdm-primary`}
            />
            {errors.company && <p className="text-red-500 text-xs mt-1">{errors.company}</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">GST Number</label>
            <input
              type="text"
              name="gst_number"
              value={formData.gst_number}
              onChange={handleChange}
              placeholder="e.g. 27AADCA0425P1Z7"
              className={`w-full p-2 border rounded-md text-sm ${errors.gst_number ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-mdm-primary`}
            />
            {errors.gst_number && <p className="text-red-500 text-xs mt-1">{errors.gst_number}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">PAN Number</label>
            <input
              type="text"
              name="pan_number"
              value={formData.pan_number}
              onChange={handleChange}
              placeholder="e.g. AADCA0425P"
              className={`w-full p-2 border rounded-md text-sm ${errors.pan_number ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-mdm-primary`}
            />
            {errors.pan_number && <p className="text-red-500 text-xs mt-1">{errors.pan_number}</p>}
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
          <textarea
            name="address"
            value={formData.address}
            onChange={handleChange}
            placeholder="e.g. 123 Main St, City, State, ZIP"
            rows={3}
            className={`w-full p-2 border rounded-md text-sm ${errors.address ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-mdm-primary`}
          />
          {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              name="email_address"
              value={formData.email_address}
              onChange={handleChange}
              placeholder="e.g. contact@example.com"
              className={`w-full p-2 border rounded-md text-sm ${errors.email_address ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-mdm-primary`}
            />
            {errors.email_address && <p className="text-red-500 text-xs mt-1">{errors.email_address}</p>}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
            <input
              type="tel"
              name="phone_number"
              value={formData.phone_number}
              onChange={handleChange}
              placeholder="e.g. +91 9876543210"
              className={`w-full p-2 border rounded-md text-sm ${errors.phone_number ? 'border-red-500' : 'border-gray-300'} focus:outline-none focus:ring-2 focus:ring-mdm-primary`}
            />
            {errors.phone_number && <p className="text-red-500 text-xs mt-1">{errors.phone_number}</p>}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 bg-mdm-primary text-white rounded-md text-sm hover:bg-mdm-primary/90 disabled:opacity-50"
          >
            {isSubmitting ? 'Creating...' : 'Create Customer'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatAssistant;

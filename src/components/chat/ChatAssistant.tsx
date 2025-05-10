// src/components/chat/ChatAssistant.tsx
import { useState, useRef, useEffect, useCallback } from "react";
import { Send, X, Upload, User, Edit3, MessageSquarePlus, Eye } from "lucide-react";
import { createCustomer } from "@/services/apiService"; 
import { Customer } from "@/types/types";
import { queryClient } from "@/App";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface Message {
  id: number;
  text: string | React.ReactNode;
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

const API_BASE_URL_CHAT = import.meta.env.VITE_CHAT_BACKEND_URL || "http://localhost:5200";

// Helper to format customer details for display
const formatCustomerForDisplay = (customer: Customer, type: 'chat_list_item' | 'modal_full_details'): React.ReactNode => {
  // For chat list item, provide a concise summary
  if (type === 'chat_list_item') {
      return `${customer.name} (Company: ${customer.company || 'N/A'}, GST: ${customer.gst_number || 'N/A'})`;
  }

  // For Modal (full details) - type === 'modal_full_details'
  const details = [
    { label: "Name", value: customer.name, important: true }, 
    { label: "Company", value: customer.company },
    { label: "GSTIN", value: customer.gst_number }, 
    { label: "PAN", value: customer.pan_number },
    { label: "Email", value: customer.email_address }, 
    { label: "Phone", value: customer.phone_number },
    { label: "Address", value: customer.address, preWrap: true }, 
    { label: "ID", value: customer.id, muted: true },
    { label: "Added On", value: customer.created_at ? new Date(customer.created_at).toLocaleString() : 'N/A', muted: true },
  ];
  return (
    <div className="grid gap-2.5 py-2 text-sm">
      {details.map(detail => 
        (detail.value || detail.value === 0 || ["ID", "Added On"].includes(detail.label)) ? ( 
        <div className="grid grid-cols-3 items-start gap-2" key={detail.label}>
            <Label className={`text-right ${detail.muted ? 'text-gray-500' : 'text-gray-600'} pt-0.5`}>{detail.label}:</Label>
            <span className={`col-span-2 ${detail.important ? "font-semibold" : ""} ${detail.preWrap ? "whitespace-pre-wrap" : ""} ${detail.muted ? "text-gray-700" : "text-gray-800"}`}>
              {String(detail.value ?? 'N/A')}
            </span>
        </div>
        ) : null
      )}
    </div>
  );
};

const ChatAssistant = ({ onClose }: ChatAssistantProps) => {
  const [messages, setMessages] = useState<Message[]>([
    { id: Date.now(), text: "Hello! I'm JIA. How can I help you with customer data today?", isUser: false, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), status: "greeting" }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [showFormFor, setShowFormFor] = useState<null | 'new' | Customer>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isViewDetailsModalOpen, setIsViewDetailsModalOpen] = useState(false);
  const [customerToView, setCustomerToView] = useState<Customer | null>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const convertToJPEG = (file: File): Promise<File> => { 
    return new Promise((resolve, reject) => {
      const img = new Image(); const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas context failed')); return; }
      img.onload = () => {
        canvas.width = img.width; canvas.height = img.height; ctx.drawImage(img, 0, 0);
        canvas.toBlob(blob => blob ? resolve(new File([blob], file.name.replace(/\.[^/.]+$/, '.jpg'), { type: 'image/jpeg', lastModified: Date.now() })) : reject(new Error('Conversion to JPEG failed')), 'image/jpeg', 0.9);
      };
      img.onerror = (e) => reject(new Error(`Image load error: ${e instanceof Event ? 'Generic image load error' : String(e)}`));
      img.src = URL.createObjectURL(file);
    });
  };
  const getBase64 = (file: File): Promise<string> => { 
    return new Promise((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(reader.result as string); reader.onerror = reject; reader.readAsDataURL(file); });
  };

  const sendMessageToChatBackend = async (messageText: string) => {
    const response = await fetch(`${API_BASE_URL_CHAT}/api/chat`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: messageText }), 
      // credentials: 'include', // Only if session cookies are needed across origins
    });
    const responseData = await response.json();
    if (!response.ok) throw new Error(responseData.message || `Chat API Error: ${response.status}`);
    return responseData;
  };

  const handleCardUploadInternal = async (file: File) => {
    let convertedFile: File;
    try { convertedFile = await convertToJPEG(file); } 
    catch (error) { throw new Error(`Error converting image: ${error instanceof Error ? error.message : "Unknown issue"}`); }
    let base64 = ""; try { base64 = await getBase64(convertedFile); } catch {}
    setMessages(prev => [...prev, { id: Date.now() -1, text: `Processing card: ${convertedFile.name}`, isUser: true, timestamp: new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}), imageDataUrl: base64 }]);
    try {
      const formData = new FormData(); formData.append("card", convertedFile);
      const response = await fetch(`${API_BASE_URL_CHAT}/api/upload-card`, { 
        method: 'POST', body: formData, 
        // credentials: 'include', 
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || `Card upload failed: ${response.status}`);
      return data;
    } catch (error) { throw error; }
  };

  const handleViewDetailsClick = (customer: Customer) => {
    setCustomerToView(customer);
    setIsViewDetailsModalOpen(true);
  };

  const handleSendMessage = async () => {
    const currentInput = inputMessage.trim();
    const currentFiles = [...uploadedFiles]; 
    if (!currentInput && currentFiles.length === 0) return;
    setIsLoading(true); setShowFormFor(null); 

    if (currentInput) {
      setMessages(prev => [...prev, { id: Date.now(), text: currentInput, isUser: true, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
      setInputMessage("");
    }
    
    let backendResponse;
    try {
      if (currentFiles.length > 0 && currentFiles[0]) {
        backendResponse = await handleCardUploadInternal(currentFiles[0]); 
        setUploadedFiles([]); 
      } else if (currentInput) {
        backendResponse = await sendMessageToChatBackend(currentInput);
      }

      if (backendResponse) {
        let botText: string | React.ReactNode = backendResponse.message || "Could not process the request.";
        
        if ((backendResponse.status === "found_single" || backendResponse.status === "existing_customer_chat" || backendResponse.status === "disambiguation_resolved") && backendResponse.customer_data && !Array.isArray(backendResponse.customer_data)) {
           // CORRECTED HERE:
           botText = (<> {(backendResponse.status === "found_single" || backendResponse.status === "disambiguation_resolved") ? "Found customer:" : "This looks like an existing customer:"} <br />{formatCustomerForDisplay(backendResponse.customer_data, 'modal_full_details')}</>);
           if (backendResponse.status === "existing_customer_chat") botText = <>{botText} <br/>Is this correct?</>;
        } else if (backendResponse.status === "found_multiple" && Array.isArray(backendResponse.customer_data) && backendResponse.customer_data.length > 0) { // Changed status check to "found_multiple"
          const customerListElements = backendResponse.customer_data.map((cust: Customer, index: number) => (
            <li key={cust.id} className="text-xs sm:text-sm py-1 flex justify-between items-center">
              <span>{index + 1}. {formatCustomerForDisplay(cust, 'chat_list_item')}</span>
              <Button variant="outline" size="sm" className="h-6 px-2 py-0.5 text-xs" onClick={() => handleViewDetailsClick(cust)}>
                <Eye size={12} className="mr-1"/> View
              </Button>
            </li>
          ));
          botText = (
            <>
              {backendResponse.message} 
              <ul className="list-none p-0 m-0 mt-1 space-y-0.5">{customerListElements}</ul>
            </>
          );
        } else if (backendResponse.status === "existing_customer_card" && backendResponse.matched_customer) {
           // CORRECTED HERE:
           botText = (<>{backendResponse.message}<br/>{formatCustomerForDisplay(backendResponse.matched_customer, 'modal_full_details')}</>);
        } else if (backendResponse.status === "new_customer_card" && backendResponse.extracted_data) {
           const extractedDetails = Object.entries(backendResponse.extracted_data).filter(([, v]) => v).map(([k, v]) => <li key={k} className="text-xs sm:text-sm">{k.replace(/_/g, ' ').replace(/\b\w/g, c=>c.toUpperCase())}: {String(v)}</li>);
           botText = (<>{backendResponse.message}<ul className="list-none p-0 m-0 mt-1 space-y-0.5">{extractedDetails}</ul></>);
        } // Other statuses will use backendResponse.message as is.

        setMessages(prev => [...prev, { 
            id: Date.now() + 1, text: botText, isUser: false, 
            timestamp: new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}), 
            customerData: backendResponse.customer_data || backendResponse.matched_customer, 
            extractedData: backendResponse.extracted_data, 
            status: backendResponse.status || "unknown" 
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
          id: Date.now() + 2, text: `Error: ${error instanceof Error ? error.message : "Unexpected error."}`, 
          isUser: false, timestamp: new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'}), 
          status: "error_response" 
      }]);
    } finally { setIsLoading(false); }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); } };
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => { if (e.target.files && e.target.files[0]) { setUploadedFiles([e.target.files[0]]); setInputMessage(`Uploading: ${e.target.files[0].name}`); setTimeout(() => handleSendMessage(), 100); }};
  const handleUploadClick = () => { if (fileInputRef.current) { fileInputRef.current.value = ""; fileInputRef.current.click(); }};
  const handleCreateNewCustomerRequest = () => { setShowFormFor('new'); };

  const shouldShowCreateButton = !showFormFor && messages.length > 0 && !messages[messages.length - 1].isUser && !isLoading &&
    !["error_response", "error_llm_extraction", "error_db_match", "error_chat_search", "extraction_error_chat", "error_image_conversion"].includes(messages[messages.length - 1].status || "");

  return (
    <>
      <div className="chat-container">
        <div className="chat-header"> 
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3"> <div className="bg-white/20 p-2 rounded-full"><User size={20} className="text-white" /></div> <div><h3 className="font-medium">JIA Assistant</h3><p className="text-xs text-white/80">Customer Database AI</p></div> </div>
                <button onClick={onClose} className="text-white hover:bg-white/20 p-1 rounded-full"> <X size={20} /> </button>
            </div>
        </div>
        <div className="chat-messages"> 
            {messages.map((message) => (
                <div key={message.id} className={`chat-message ${message.isUser ? 'user' : 'bot'}`}>
                {!message.isUser && (<div className="h-8 w-8 bg-blue-500 rounded-full flex items-center justify-center shrink-0"><MessageSquarePlus size={16} className="text-white" /></div>)}
                <div className={`chat-bubble ${message.isUser ? 'user' : 'bot'}`}>
                    {message.imageDataUrl && ( <img src={message.imageDataUrl} alt="Uploaded card" className="max-w-xs mb-2 rounded" /> )}
                    <div className="whitespace-pre-wrap">{message.text}</div>
                    <div className="text-xs opacity-70 mt-1">{message.timestamp}</div>
                </div>
                {message.isUser && (<div className="h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center shrink-0"><User size={14} className="text-gray-600" /></div>)}
                </div>
            ))}
            <div ref={messagesEndRef} />
            {isLoading && (<div className="flex justify-center my-2"><div className="bg-gray-200 px-3 py-1 rounded-full animate-pulse"><span className="text-xs text-gray-500">JIA is thinking...</span></div></div>)}
            {shouldShowCreateButton && (<div className="mt-3 mb-1 px-2 flex justify-center"><Button onClick={handleCreateNewCustomerRequest} size="sm" variant="outline" className="text-xs"><Edit3 size={14} className="mr-1.5"/> Create New Customer</Button></div>)}
            {showFormFor && (<CustomerOnboardingForm onCancel={() => setShowFormFor(null)} prefillData={typeof showFormFor === 'object' ? showFormFor : (showFormFor === 'new' ? messages.slice().reverse().find(m => !m.isUser && m.extractedData)?.extractedData : undefined)} isEditing={typeof showFormFor === 'object'}/>)}
        </div>
        <div className="chat-input-container"> 
            <div className="relative">
                <input type="text" value={inputMessage} onChange={(e) => setInputMessage(e.target.value)} onKeyDown={handleKeyDown} placeholder="Search or describe details..." className="chat-input pr-24" disabled={isLoading || !!showFormFor} />
                <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex gap-1">
                <button onClick={handleUploadClick} className="text-gray-500 hover:text-mdm-primary p-2 rounded-full hover:bg-gray-100" disabled={isLoading || !!showFormFor} title="Upload visiting card"> <Upload size={18} /> </button>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden"/>
                <Button size="icon" className="rounded-full h-9 w-9" onClick={handleSendMessage} disabled={isLoading || !!showFormFor || (!inputMessage.trim() && uploadedFiles.length === 0)}> <Send size={18} /> </Button>
                </div>
            </div>
        </div>
      </div>

      <Dialog open={isViewDetailsModalOpen} onOpenChange={setIsViewDetailsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>Customer Details</DialogTitle></DialogHeader>
          {/* CORRECTED HERE: */}
          {customerToView && formatCustomerForDisplay(customerToView, 'modal_full_details')}
          <DialogFooter><Button variant="outline" onClick={() => setIsViewDetailsModalOpen(false)}>Close</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

// --- CustomerOnboardingForm ---
// (This component should be exactly as provided in the previous complete answer for it)
interface CustomerOnboardingFormProps { onCancel: () => void; prefillData?: Partial<Customer>; isEditing?: boolean; }
type NewCustomerFormData = Omit<Customer, 'id' | 'created_at'>;
const CustomerOnboardingForm = ({ onCancel, prefillData, isEditing }: CustomerOnboardingFormProps) => {
  const [formData, setFormData] = useState<NewCustomerFormData>({ name: prefillData?.name || "", company: prefillData?.company || "", gst_number: prefillData?.gst_number || "", pan_number: prefillData?.pan_number || "", address: prefillData?.address || "", email_address: prefillData?.email_address || "", phone_number: prefillData?.phone_number || "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submissionStatus, setSubmissionStatus] = useState<{type: 'success' | 'error', message: string} | null>(null);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); if (errors[name]) { setErrors(prev => ({ ...prev, [name]: "" })); }};
  const validateForm = () => { 
    const newErrors: Record<string, string> = {}; 
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (formData.gst_number && !/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}Z[A-Z\d]{1}$/i.test(formData.gst_number)) newErrors.gst_number = "Invalid GST (e.g. 27ABCDE1234F1Z5)";
    if (formData.pan_number && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/i.test(formData.pan_number)) newErrors.pan_number = "Invalid PAN (e.g. ABCDE1234F)";
    if (formData.email_address && formData.email_address.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email_address)) newErrors.email_address = "Invalid email";
    if (formData.phone_number && !/^\+?\d{10,15}$/.test(formData.phone_number.replace(/\D/g, ''))) newErrors.phone_number = "Invalid phone (10-15 digits, optional '+')";
    setErrors(newErrors); return Object.keys(newErrors).length === 0; 
  };
  const handleSubmit = async (e: React.FormEvent) => { e.preventDefault(); if (!validateForm()) return; setIsSubmitting(true); setSubmissionStatus(null); try { const createdOrUpdated = await createCustomer(formData); /* Assuming createCustomer handles both for now or you have an updateCustomer */ setSubmissionStatus({ type: 'success', message: `Customer "${createdOrUpdated.name}" ${isEditing ? 'updated' : 'created'}.` }); queryClient.invalidateQueries({ queryKey: ['customers'] }); queryClient.invalidateQueries({ queryKey: ['allCustomersInitial'] }); queryClient.invalidateQueries({ queryKey: ['customerCount'] }); queryClient.invalidateQueries({ queryKey: ['dashboardStats'] }); setTimeout(() => { onCancel(); }, 2000); } catch (error: any) { setSubmissionStatus({ type: 'error', message: `Failed: ${error?.message || "Unknown error"}` }); } finally { setIsSubmitting(false); }};
  return ( <div className="bg-blue-50 p-3 sm:p-4 rounded-lg mt-4 text-sm border border-blue-200 shadow-sm"> <div className="flex justify-between items-center mb-3"> <h3 className="font-medium text-base text-gray-800">{isEditing ? 'Edit' : 'Add New'} Customer</h3> <button onClick={onCancel} className="text-gray-500 hover:text-gray-700 p-1 rounded-full hover:bg-gray-200"> <X size={18} /> </button> </div> {submissionStatus && (<div className={`mb-3 p-2.5 rounded-md text-xs ${submissionStatus.type === 'success' ? 'bg-green-100 text-green-700 border-green-200' : 'bg-red-100 text-red-700 border-red-200'}`}>{submissionStatus.message}</div>)} <form className="space-y-3" onSubmit={handleSubmit}>  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><div><Label htmlFor="form-name-onboarding" className="text-xs font-medium text-gray-700">Name <span className="text-red-500">*</span></Label><Input id="form-name-onboarding" name="name" value={formData.name} onChange={handleChange} className={`mt-1 text-sm ${errors.name ? 'border-red-500':'border-gray-300'}`} />{errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}</div><div><Label htmlFor="form-company-onboarding" className="text-xs font-medium text-gray-700">Company</Label><Input id="form-company-onboarding" name="company" value={formData.company} onChange={handleChange} className={`mt-1 text-sm ${errors.company ? 'border-red-500':'border-gray-300'}`} />{errors.company && <p className="text-red-500 text-xs mt-1">{errors.company}</p>}</div></div> <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><div><Label htmlFor="form-email-onboarding" className="text-xs font-medium text-gray-700">Email</Label><Input id="form-email-onboarding" type="email" name="email_address" value={formData.email_address} onChange={handleChange} className={`mt-1 text-sm ${errors.email_address ? 'border-red-500':'border-gray-300'}`} />{errors.email_address && <p className="text-red-500 text-xs mt-1">{errors.email_address}</p>}</div><div><Label htmlFor="form-phone-onboarding" className="text-xs font-medium text-gray-700">Phone</Label><Input id="form-phone-onboarding" name="phone_number" value={formData.phone_number} onChange={handleChange} className={`mt-1 text-sm ${errors.phone_number ? 'border-red-500':'border-gray-300'}`} />{errors.phone_number && <p className="text-red-500 text-xs mt-1">{errors.phone_number}</p>}</div></div> <div className="grid grid-cols-1 sm:grid-cols-2 gap-3"><div><Label htmlFor="form-gst-onboarding" className="text-xs font-medium text-gray-700">GST Number</Label><Input id="form-gst-onboarding" name="gst_number" value={formData.gst_number} onChange={handleChange} className={`mt-1 text-sm ${errors.gst_number ? 'border-red-500':'border-gray-300'}`} />{errors.gst_number && <p className="text-red-500 text-xs mt-1">{errors.gst_number}</p>}</div><div><Label htmlFor="form-pan-onboarding" className="text-xs font-medium text-gray-700">PAN Number</Label><Input id="form-pan-onboarding" name="pan_number" value={formData.pan_number} onChange={handleChange} className={`mt-1 text-sm ${errors.pan_number ? 'border-red-500':'border-gray-300'}`} />{errors.pan_number && <p className="text-red-500 text-xs mt-1">{errors.pan_number}</p>}</div></div><div><Label htmlFor="form-address-onboarding" className="text-xs font-medium text-gray-700">Address</Label><Textarea id="form-address-onboarding" name="address" value={formData.address} onChange={handleChange} rows={2} className={`mt-1 text-sm ${errors.address ? 'border-red-500':'border-gray-300'}`} />{errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}</div> <div className="flex justify-end gap-2 pt-2"> <Button type="button" variant="outline" size="sm" onClick={onCancel} disabled={isSubmitting}> Cancel </Button> <Button type="submit" size="sm" disabled={isSubmitting}> {isSubmitting ? 'Saving...' : (isEditing ? 'Update' : 'Create')} </Button> </div> </form> </div> );
};

export default ChatAssistant;

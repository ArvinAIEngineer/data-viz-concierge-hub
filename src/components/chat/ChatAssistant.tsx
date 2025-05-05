
import { useState } from "react";
import { Send, X, Upload, User } from "lucide-react";

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: string;
}

interface ChatAssistantProps {
  onClose: () => void;
}

const ChatAssistant = ({ onClose }: ChatAssistantProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "I'm here to help! Try something like 'Find customer Acme Corporation' or ask me about GST or customer onboarding.",
      isUser: false,
      timestamp: "04:47 PM"
    }
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;
    
    const newUserMessage = {
      id: messages.length + 1,
      text: inputMessage,
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages([...messages, newUserMessage]);
    setInputMessage("");
    
    // Simulate a response after a short delay
    setTimeout(() => {
      // Example response - in a real app, this would be the response from your Flask backend
      if (inputMessage.toLowerCase().includes("gst") || inputMessage.toLowerCase().includes("find")) {
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          text: "Sorry, I can't find it in my database. Please check the name or provide a GST number.",
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
        
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: prev.length + 1,
            text: "This customer does not exist. To create a new customer, please have the following ready:\n\n• GST Number\n• PAN Number\n• Soft copies of ID Proofs",
            isUser: false,
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }]);
        }, 500);
      } else {
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          text: "I understand you're looking for information. Could you provide more details like a company name or GST number?",
          isUser: false,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    }, 1000);
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

  const sendMessageToBackend = async (message: string) => {
    try {
      // This would be replaced with your actual API endpoint
      const response = await fetch('https://your-flask-backend.com/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message }),
      });
      
      const data = await response.json();
      return data.response;
    } catch (error) {
      console.error('Error communicating with backend:', error);
      return "Sorry, I'm having trouble connecting to the server.";
    }
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
        
        {messages.some(m => m.text.includes("This customer does not exist")) && !showForm && (
          <div className="mt-4">
            <button 
              onClick={handleCreateNewCustomer}
              className="bg-mdm-primary text-white px-4 py-2 rounded-lg text-sm font-medium"
            >
              Create New Customer
            </button>
          </div>
        )}
        
        {showForm && <CustomerOnboardingForm onCancel={() => setShowForm(false)} />}
      </div>
      
      <div className="chat-input-container">
        <div className="relative">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search for a customer..."
            className="chat-input pr-12"
          />
          <button
            onClick={handleSendMessage}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-mdm-primary text-white p-2 rounded-full"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

interface CustomerOnboardingFormProps {
  onCancel: () => void;
}

const CustomerOnboardingForm = ({ onCancel }: CustomerOnboardingFormProps) => {
  return (
    <div className="bg-blue-50 p-4 rounded-lg mt-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium">New Customer Onboarding</h3>
        <button onClick={onCancel} className="text-gray-500">
          <X size={16} />
        </button>
      </div>
      
      <form className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">GST Number <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              placeholder="e.g. 27AADCA0425P1Z7"
              className="w-full p-2 border rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">PAN Number <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              placeholder="e.g. AADCA0425P"
              className="w-full p-2 border rounded text-sm"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm mb-1">Customer Name <span className="text-red-500">*</span></label>
          <input 
            type="text" 
            placeholder="Enter full legal name"
            className="w-full p-2 border rounded text-sm"
          />
        </div>
        
        <div>
          <label className="block text-sm mb-1">Address <span className="text-red-500">*</span></label>
          <textarea 
            placeholder="Enter complete address"
            className="w-full p-2 border rounded text-sm"
            rows={2}
          ></textarea>
        </div>
        
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm mb-1">Contact Person</label>
            <input 
              type="text" 
              placeholder="Name"
              className="w-full p-2 border rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input 
              type="email" 
              placeholder="email@example.com"
              className="w-full p-2 border rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Phone</label>
            <input 
              type="tel" 
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
              <button className="w-full p-2 border rounded text-sm flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100">
                <Upload size={14} />
                <span>Upload PDF or Image (Max 5MB)</span>
              </button>
            </div>
            
            <div>
              <label className="block text-sm mb-1">PAN Card <span className="text-red-500">*</span></label>
              <button className="w-full p-2 border rounded text-sm flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100">
                <Upload size={14} />
                <span>Upload PDF or Image (Max 5MB)</span>
              </button>
            </div>
            
            <div>
              <label className="block text-sm mb-1">Additional ID Proof (Optional)</label>
              <button className="w-full p-2 border rounded text-sm flex items-center justify-center gap-2 bg-gray-50 hover:bg-gray-100">
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
          >
            Cancel
          </button>
          <button 
            type="button"
            className="px-4 py-2 bg-mdm-primary text-white rounded text-sm"
          >
            Create Customer
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatAssistant;

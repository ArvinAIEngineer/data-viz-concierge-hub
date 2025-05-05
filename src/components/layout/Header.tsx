
import { Search, Bell, MessageSquare } from "lucide-react";

interface HeaderProps {
  toggleChat: () => void;
}

const Header = ({ toggleChat }: HeaderProps) => {
  return (
    <header className="bg-white border-b border-gray-200 py-3 px-6">
      <div className="flex justify-between items-center">
        <div className="w-1/3">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Quick search..."
              className="pl-10 pr-4 py-2 w-full max-w-md rounded-full bg-gray-100 border-0 focus:ring-2 focus:ring-mdm-primary focus:outline-none text-sm"
            />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleChat}
            className="p-2 rounded-full hover:bg-gray-100 transition-colors"
          >
            <MessageSquare className="h-5 w-5 text-gray-600" />
          </button>
          
          <div className="relative">
            <button className="p-2 rounded-full hover:bg-gray-100 transition-colors">
              <Bell className="h-5 w-5 text-gray-600" />
            </button>
            <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full"></span>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center text-sm font-medium text-gray-600">
              JD
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

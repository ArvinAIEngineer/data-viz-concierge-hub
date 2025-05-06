
import { NavLink } from "react-router-dom";
import { Home, Users, PackageSearch, FileBarChart, Settings, LogOut } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { getCustomerCount } from "@/services/apiService";
import { Skeleton } from "@/components/ui/skeleton";

const Sidebar = () => {
  const { data: customerCount, isLoading: isCustomerCountLoading } = useQuery({
    queryKey: ['customerCount'],
    queryFn: getCustomerCount,
    retry: 1
  });

  return (
    <div className="w-64 bg-mdm-sidebar border-r border-gray-200 flex flex-col">
      <div className="p-5 border-b border-gray-200">
        <h1 className="text-xl font-bold text-mdm-primary">MDMPlatform</h1>
      </div>
      
      <nav className="flex-1 pt-5 pb-4 px-3 space-y-1">
        <NavLink 
          to="/" 
          className={({ isActive }) => 
            `sidebar-item ${isActive ? 'active' : ''}`
          }
          end
        >
          <Home size={20} />
          <span>Dashboard</span>
        </NavLink>
        
        <NavLink 
          to="/customers" 
          className={({ isActive }) => 
            `sidebar-item ${isActive ? 'active' : ''}`
          }
        >
          <Users size={20} />
          <span>Customers</span>
          {isCustomerCountLoading ? (
            <Skeleton className="ml-auto w-6 h-5 rounded-full" />
          ) : (
            <span className="ml-auto bg-gray-200 text-gray-700 text-xs px-2 py-0.5 rounded-full">
              {customerCount}
            </span>
          )}
        </NavLink>
        
        <NavLink 
          to="/vendors" 
          className={({ isActive }) => 
            `sidebar-item ${isActive ? 'active' : ''}`
          }
        >
          <PackageSearch size={20} />
          <span>Vendors</span>
        </NavLink>
        
        <NavLink 
          to="/reports" 
          className={({ isActive }) => 
            `sidebar-item ${isActive ? 'active' : ''}`
          }
        >
          <FileBarChart size={20} />
          <span>Reports</span>
        </NavLink>
        
        <NavLink 
          to="/settings" 
          className={({ isActive }) => 
            `sidebar-item ${isActive ? 'active' : ''}`
          }
        >
          <Settings size={20} />
          <span>Settings</span>
        </NavLink>
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        <button className="sidebar-item w-full">
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;

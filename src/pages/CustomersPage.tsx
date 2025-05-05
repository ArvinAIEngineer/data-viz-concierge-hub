
import { useState } from "react";
import { Search, Filter, Plus, Download, Upload } from "lucide-react";

const CustomersPage = () => {
  const [customers] = useState([
    { id: 1, name: "Acme Corporation", gst: "27AADCA0425P1Z7", location: "Mumbai", industry: "Manufacturing", level: "Gold" },
    { id: 2, name: "Stark Industries", gst: "29AABCS1234P1Z5", location: "Bangalore", industry: "Technology", level: "Platinum" },
    { id: 3, name: "Wayne Enterprises", gst: "06AABCW5896P1Z3", location: "Delhi", industry: "Retail", level: "Silver" },
    { id: 4, name: "Globex Corporation", gst: "33AARCG7485P1Z6", location: "Chennai", industry: "Energy", level: "Gold" },
    { id: 5, name: "Initech Inc", gst: "19AADCI2541P1Z4", location: "Hyderabad", industry: "Finance", level: "Bronze" },
  ]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Customers</h1>
        
        <div className="flex gap-3">
          <button className="px-4 py-2 border rounded-md flex items-center gap-2 hover:bg-gray-50">
            <Upload size={16} />
            <span>Import</span>
          </button>
          <button className="px-4 py-2 border rounded-md flex items-center gap-2 hover:bg-gray-50">
            <Download size={16} />
            <span>Export</span>
          </button>
          <button className="px-4 py-2 bg-mdm-primary text-white rounded-md flex items-center gap-2">
            <Plus size={16} />
            <span>Add Customer</span>
          </button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 flex justify-between border-b">
          <div className="relative w-80">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search customers..."
              className="pl-10 pr-4 py-2 w-full rounded-md border focus:ring-2 focus:ring-mdm-primary focus:outline-none"
            />
          </div>
          
          <button className="px-4 py-2 border rounded-md flex items-center gap-2 hover:bg-gray-50">
            <Filter size={16} />
            <span>Filters</span>
          </button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 text-left text-gray-500 uppercase text-xs">
              <tr>
                <th className="px-6 py-3 font-medium">Name</th>
                <th className="px-6 py-3 font-medium">GST Number</th>
                <th className="px-6 py-3 font-medium">Location</th>
                <th className="px-6 py-3 font-medium">Industry</th>
                <th className="px-6 py-3 font-medium">Partnership Level</th>
                <th className="px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{customer.name}</td>
                  <td className="px-6 py-4">{customer.gst}</td>
                  <td className="px-6 py-4">{customer.location}</td>
                  <td className="px-6 py-4">{customer.industry}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      customer.level === 'Platinum' ? 'bg-purple-100 text-purple-800' :
                      customer.level === 'Gold' ? 'bg-yellow-100 text-yellow-800' :
                      customer.level === 'Silver' ? 'bg-gray-100 text-gray-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {customer.level}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-blue-600 hover:text-blue-800">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t flex justify-between items-center">
          <div className="text-sm text-gray-500">
            Showing 1-5 of 5 customers
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1 border rounded-md disabled:opacity-50">Previous</button>
            <button className="px-3 py-1 border rounded-md bg-gray-50">1</button>
            <button className="px-3 py-1 border rounded-md disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomersPage;


import { useState, useEffect } from "react";
import { Search, Filter, Plus, Download, Upload } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { getCustomers, createCustomer } from "@/services/apiService";
import { Customer } from "@/types/types";

const CustomersPage = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    name: "",
    phone_number: "",
    email_address: "",
    company: "",
    gst_number: "",
    pan_number: "",
    address: "",
  });
  const { toast } = useToast();

  const { data: customers = [], isLoading, refetch } = useQuery({
    queryKey: ['customers'],
    queryFn: getCustomers,
    retry: 1,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewCustomer((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createCustomer(newCustomer);
      toast({
        title: "Customer added successfully",
        description: `${newCustomer.name} has been added to your customer list`,
      });
      setIsAddDialogOpen(false);
      setNewCustomer({
        name: "",
        phone_number: "",
        email_address: "",
        company: "",
        gst_number: "",
        pan_number: "",
        address: "",
      });
      refetch(); // Refresh the customer list
    } catch (error) {
      console.error("Error adding customer:", error);
      toast({
        title: "Failed to add customer",
        description: "There was an issue adding the customer. Please try again.",
        variant: "destructive",
      });
    }
  };

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
          <Button 
            className="px-4 py-2 bg-mdm-primary text-white rounded-md flex items-center gap-2"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus size={16} />
            <span>Add Customer</span>
          </Button>
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
                <th className="px-6 py-3 font-medium">Company</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Phone</th>
                <th className="px-6 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">Loading customers...</td>
                </tr>
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center">No customers found</td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{customer.name}</td>
                    <td className="px-6 py-4">{customer.gst_number || '-'}</td>
                    <td className="px-6 py-4">{customer.company || '-'}</td>
                    <td className="px-6 py-4">{customer.email_address || '-'}</td>
                    <td className="px-6 py-4">{customer.phone_number || '-'}</td>
                    <td className="px-6 py-4">
                      <button className="text-blue-600 hover:text-blue-800">View</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {isLoading ? 'Loading...' : `Showing ${customers.length} customers`}
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1 border rounded-md disabled:opacity-50">Previous</button>
            <button className="px-3 py-1 border rounded-md bg-gray-50">1</button>
            <button className="px-3 py-1 border rounded-md disabled:opacity-50">Next</button>
          </div>
        </div>
      </div>

      {/* Add Customer Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    name="name" 
                    value={newCustomer.name}
                    onChange={handleInputChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input 
                    id="phone_number" 
                    name="phone_number"
                    value={newCustomer.phone_number}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email_address">Email Address</Label>
                  <Input 
                    id="email_address"
                    name="email_address"
                    type="email"
                    value={newCustomer.email_address}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company</Label>
                  <Input 
                    id="company"
                    name="company"
                    value={newCustomer.company}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gst_number">GST Number</Label>
                  <Input 
                    id="gst_number"
                    name="gst_number"
                    value={newCustomer.gst_number}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pan_number">PAN Number</Label>
                  <Input 
                    id="pan_number"
                    name="pan_number"
                    value={newCustomer.pan_number}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input 
                  id="address"
                  name="address"
                  value={newCustomer.address}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">Add Customer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomersPage;

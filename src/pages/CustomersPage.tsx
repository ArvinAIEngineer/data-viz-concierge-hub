// src/pages/CustomersPage.tsx
import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, Filter, Plus, Download, Upload, Edit, Trash2, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient, UseQueryResult } from "@tanstack/react-query"; // Added UseQueryResult
import { getCustomers, createCustomer } from "@/services/apiService";
import { Customer } from "@/types/types";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Debounce function (can be moved to a utils file if used elsewhere)
const debounce = <F extends (...args: any[]) => any>(func: F, waitFor: number) => {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  const debounced = (...args: Parameters<F>) => {
    if (timeout !== null) {
      clearTimeout(timeout);
      timeout = null;
    }
    timeout = setTimeout(() => func(...args), waitFor);
  };
  return debounced as (...args: Parameters<F>) => ReturnType<F>;
};

const CustomersPage = () => {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  
  const [allCustomersMasterList, setAllCustomersMasterList] = useState<Customer[]>([]);
  const [displayedCustomers, setDisplayedCustomers] = useState<Customer[]>([]);
  
  const [clientSearchTerm, setClientSearchTerm] = useState("");
  const [serverSearchTerm, setServerSearchTerm] = useState(""); 
  const [isUsingServerSearch, setIsUsingServerSearch] = useState(false);

  const [newCustomer, setNewCustomer] = useState<Omit<Customer, "id" | "created_at">>({
    name: "", phone_number: "", email_address: "", company: "", gst_number: "", pan_number: "", address: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const queryOptions = {
    queryKey: ['customersList', serverSearchTerm, isUsingServerSearch], 
    queryFn: () => {
      if (isUsingServerSearch && serverSearchTerm.trim() !== "") {
        console.log(`Querying backend with: "${serverSearchTerm}"`);
        return getCustomers(serverSearchTerm);
      } else if (!isUsingServerSearch) {
        console.log("Fetching all customers for client-side.");
        return getCustomers();
      }
      return Promise.resolve([]);
    },
    enabled: true,
    staleTime: isUsingServerSearch ? 1 * 60 * 1000 : 5 * 60 * 1000,
     // meta: { onError: (error) => toast({ title: "Error fetching customers", description: error.message, variant: "destructive" }) } // Meta for global error handling
  };

  const { 
    data: fetchedCustomers, 
    isLoading, 
    isFetching, 
    isSuccess, // Use isSuccess to trigger side effects
    isError,   // Use isError for error handling
    error: queryError, // Actual error object
    refetch: refetchCustomersQuery 
  }: UseQueryResult<Customer[], Error> = useQuery<Customer[], Error, Customer[], (string|boolean)[]>(queryOptions);
  

  // useEffect to handle side effects of useQuery (replaces onSuccess)
  useEffect(() => {
    if (isSuccess && fetchedCustomers) {
      const customersData = fetchedCustomers || [];
      if (!isUsingServerSearch) {
        console.log(`Fetched ${customersData.length} customers for client-side master list.`);
        setAllCustomersMasterList(customersData);
        applyClientSideFilters(customersData, clientSearchTerm);
      } else {
        console.log(`Server search returned ${customersData.length} customers.`);
        setDisplayedCustomers(customersData);
      }
    }
  }, [isSuccess, fetchedCustomers, isUsingServerSearch, clientSearchTerm]); // Add applyClientSideFilters to dependency array if it's not memoized

  // useEffect to handle errors from useQuery
  useEffect(() => {
    if (isError && queryError) {
        toast({
            title: "Error fetching customer data",
            description: queryError.message || "An unexpected error occurred.",
            variant: "destructive",
        });
    }
  }, [isError, queryError, toast]);


  const createCustomerMutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: (newlyCreatedCustomer) => {
      toast({ title: "Customer added successfully", description: `${newlyCreatedCustomer?.name || 'New customer'} has been added.` });
      setIsAddDialogOpen(false);
      setNewCustomer({ name: "", phone_number: "", email_address: "", company: "", gst_number: "", pan_number: "", address: "" });
      
      if (newlyCreatedCustomer) {
        const updatedMasterList = [...allCustomersMasterList, newlyCreatedCustomer].sort((a,b) => a.name.localeCompare(b.name));
        setAllCustomersMasterList(updatedMasterList);
        applyClientSideFilters(updatedMasterList, clientSearchTerm);
      } else {
        refetchCustomersQuery();
      }

      queryClient.invalidateQueries({ queryKey: ['customerCount'] });
      queryClient.invalidateQueries({ queryKey: ['dashboardStats'] });
    },
    onError: (error: any) => { // error type can be more specific if you know it
      toast({ title: "Failed to add customer", description: error?.message || "There was an issue.", variant: "destructive" });
    },
  });

  const applyClientSideFilters = useCallback((masterList: Customer[], currentSearchTerm: string) => {
    if (!masterList) {
      setDisplayedCustomers([]);
      return;
    }
    let customersToFilter = [...masterList];
    const lowerSearchTerm = currentSearchTerm.toLowerCase();

    if (lowerSearchTerm) {
      customersToFilter = customersToFilter.filter(customer => 
        (customer.name?.toLowerCase().includes(lowerSearchTerm)) ||
        (customer.company?.toLowerCase().includes(lowerSearchTerm)) ||
        (customer.email_address?.toLowerCase().includes(lowerSearchTerm)) ||
        (customer.phone_number?.includes(lowerSearchTerm)) || 
        (customer.gst_number?.toLowerCase().includes(lowerSearchTerm)) ||
        (customer.pan_number?.toLowerCase().includes(lowerSearchTerm)) ||
        (customer.address?.toLowerCase().includes(lowerSearchTerm))
      );
    }
    setDisplayedCustomers(customersToFilter);
  }, []); // Empty dependency array as it doesn't depend on component state/props directly

  useEffect(() => {
    if (!isUsingServerSearch) {
      const handler = setTimeout(() => {
        applyClientSideFilters(allCustomersMasterList, clientSearchTerm);
      }, 300);
      return () => clearTimeout(handler);
    }
  }, [clientSearchTerm, allCustomersMasterList, isUsingServerSearch, applyClientSideFilters]);
  
  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSearchTerm = e.target.value;
    if (isUsingServerSearch) {
      setServerSearchTerm(newSearchTerm);
    } else {
      setClientSearchTerm(newSearchTerm);
    }
  };
  
  const handleDialogInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewCustomer((prev) => ({ ...prev, [name]: value }));
  };

  const handleDialogSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name) {
      toast({ title: "Name is required", variant: "destructive" }); return;
    }
    createCustomerMutation.mutate(newCustomer);
  };

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsViewDialogOpen(true);
  };

  const currentLoadingState = isLoading || isFetching;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-semibold">Customers</h1>
        <div className="flex gap-3">
          <Button variant="outline" disabled> <Upload size={16} className="mr-2" /> Import </Button>
          <Button variant="outline" disabled> <Download size={16} className="mr-2" /> Export </Button>
          <Button onClick={() => setIsAddDialogOpen(true)} disabled={createCustomerMutation.isPending}>
            <Plus size={16} className="mr-2" /> Add Customer
          </Button>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="p-4 flex justify-between items-center border-b">
          <div className="relative w-full md:w-80">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search customers..."
              value={isUsingServerSearch ? serverSearchTerm : clientSearchTerm}
              onChange={handleSearchInputChange}
              className="pl-10 pr-4 py-2 w-full"
            />
          </div>
          <Button variant="outline" disabled> <Filter size={16} className="mr-2" /> Filters </Button>
        </div>
        
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>GST Number</TableHead>
                <TableHead>Company</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentLoadingState ? (
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={`skeleton-${index}`}>
                    <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-28" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell className="text-right"><Skeleton className="h-8 w-20 inline-block" /></TableCell>
                  </TableRow>
                ))
              ) : displayedCustomers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center">
                    {allCustomersMasterList.length === 0 && !serverSearchTerm ? "No customers yet. Add one!" 
                     : `No customers found matching "${isUsingServerSearch ? serverSearchTerm : clientSearchTerm}".`}
                  </TableCell>
                </TableRow>
              ) : (
                displayedCustomers.map((customer) => (
                  <TableRow key={customer.id}>
                    <TableCell className="font-medium">{customer.name}</TableCell>
                    <TableCell>{customer.gst_number || '-'}</TableCell>
                    <TableCell>{customer.company || '-'}</TableCell>
                    <TableCell>{customer.email_address || '-'}</TableCell>
                    <TableCell>{customer.phone_number || '-'}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => handleViewCustomer(customer)} title="View Details">
                        <Eye size={16} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            {(displayedCustomers.length > 0 || currentLoadingState) && (
                <TableCaption>
                    {currentLoadingState ? (isUsingServerSearch ? 'Searching on server...' : 'Loading customers...') :
                     `Showing ${displayedCustomers.length} of ${isUsingServerSearch ? 'server results' : allCustomersMasterList.length + ' total'} customers ${ (isUsingServerSearch ? serverSearchTerm : clientSearchTerm) ? `matching "${isUsingServerSearch ? serverSearchTerm : clientSearchTerm}"` : ''}.`}
                </TableCaption>
            )}
          </Table>
        </div>
        
        <div className="p-4 border-t flex justify-between items-center">
          <div className="text-sm text-gray-500">
             Displaying {displayedCustomers.length} {displayedCustomers.length === 1 ? "customer" : "customers"}
             {(clientSearchTerm && !isUsingServerSearch) && ` (filtered from ${allCustomersMasterList.length})`}
          </div>
        </div>
      </div>

      {/* Add Customer Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Add New Customer</DialogTitle>
            <DialogDescription>Fill in the details below to add a new customer.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleDialogSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="form-add-name">Name <span className="text-red-500">*</span></Label>
                  <Input id="form-add-name" name="name" value={newCustomer.name} onChange={handleDialogInputChange} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="form-add-company">Company</Label>
                  <Input id="form-add-company" name="company" value={newCustomer.company} onChange={handleDialogInputChange} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="form-add-email">Email Address</Label>
                  <Input id="form-add-email" name="email_address" type="email" value={newCustomer.email_address} onChange={handleDialogInputChange} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="form-add-phone">Phone Number</Label>
                  <Input id="form-add-phone" name="phone_number" value={newCustomer.phone_number} onChange={handleDialogInputChange} />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="form-add-gst">GST Number</Label>
                  <Input id="form-add-gst" name="gst_number" value={newCustomer.gst_number} onChange={handleDialogInputChange} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="form-add-pan">PAN Number</Label>
                  <Input id="form-add-pan" name="pan_number" value={newCustomer.pan_number} onChange={handleDialogInputChange} />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="form-add-address">Address</Label>
                <Input id="form-add-address" name="address" value={newCustomer.address} onChange={handleDialogInputChange} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)} disabled={createCustomerMutation.isPending}>
                Cancel
              </Button>
              <Button type="submit" disabled={createCustomerMutation.isPending}>
                {createCustomerMutation.isPending ? "Adding..." : "Add Customer"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Customer Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader> <DialogTitle>Customer Details</DialogTitle> </DialogHeader>
          {selectedCustomer && (
            <div className="grid gap-3 py-4 text-sm">
              {[
                { label: "Name", value: selectedCustomer.name, isMedium: true },
                { label: "Company", value: selectedCustomer.company },
                { label: "Email", value: selectedCustomer.email_address },
                { label: "Phone", value: selectedCustomer.phone_number },
                { label: "GSTIN", value: selectedCustomer.gst_number },
                { label: "PAN", value: selectedCustomer.pan_number },
                { label: "Address", value: selectedCustomer.address, preWrap: true },
                { label: "Customer ID", value: selectedCustomer.id, isMuted: true },
                { label: "Added On", value: selectedCustomer.created_at ? new Date(selectedCustomer.created_at).toLocaleString() : 'N/A', isMuted: true },
              ].map(({ label, value, isMedium, preWrap, isMuted }) => (
                  (value || value === 0 || ["ID", "Added On"].includes(label) ) ? 
                  <div className="grid grid-cols-3 items-start gap-2" key={label}>
                      <Label className="text-right text-gray-500 pt-0.5">{label}:</Label>
                      <span className={`col-span-2 ${isMedium ? "font-medium" : ""} ${preWrap ? "whitespace-pre-wrap" : ""} ${isMuted ? "text-gray-600" : ""}`}>
                        {value === null || value === undefined ? 'N/A' : String(value)}
                      </span>
                  </div>
                  : null
              ))}
            </div>
          )}
          <DialogFooter> <Button type="button" variant="outline" onClick={() => setIsViewDialogOpen(false)}> Close </Button> </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomersPage;

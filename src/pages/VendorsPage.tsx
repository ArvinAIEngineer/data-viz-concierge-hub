
import { PackageSearch } from "lucide-react";

const VendorsPage = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
      <PackageSearch size={48} className="text-gray-400 mb-4" />
      <h1 className="text-2xl font-semibold mb-2">Vendors Management</h1>
      <p className="text-gray-500 max-w-md text-center">
        This module allows you to manage all your vendor data, including their contact information, contracts, and performance metrics.
      </p>
    </div>
  );
};

export default VendorsPage;

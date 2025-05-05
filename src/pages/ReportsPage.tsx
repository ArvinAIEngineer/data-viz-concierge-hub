
import { FileBarChart } from "lucide-react";

const ReportsPage = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
      <FileBarChart size={48} className="text-gray-400 mb-4" />
      <h1 className="text-2xl font-semibold mb-2">Reports & Analytics</h1>
      <p className="text-gray-500 max-w-md text-center">
        Access comprehensive reports and analytics on your master data across all systems to gain insights and make better decisions.
      </p>
    </div>
  );
};

export default ReportsPage;

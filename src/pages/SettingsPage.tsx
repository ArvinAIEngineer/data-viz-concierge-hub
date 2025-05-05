
import { Settings } from "lucide-react";

const SettingsPage = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
      <Settings size={48} className="text-gray-400 mb-4" />
      <h1 className="text-2xl font-semibold mb-2">Platform Settings</h1>
      <p className="text-gray-500 max-w-md text-center">
        Configure your MDM platform settings, manage user permissions, and customize data integration options.
      </p>
    </div>
  );
};

export default SettingsPage;


import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import ChatAssistant from "../chat/ChatAssistant";
import { useState } from "react";

const MainLayout = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleChat={() => setIsChatOpen(!isChatOpen)} />
        <main className="flex-1 overflow-auto p-6 bg-gray-50">
          <Outlet />
        </main>
      </div>
      {isChatOpen && <ChatAssistant onClose={() => setIsChatOpen(false)} />}
    </div>
  );
};

export default MainLayout;

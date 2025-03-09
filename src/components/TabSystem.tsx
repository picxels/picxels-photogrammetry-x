
import React from "react";
import { Button } from "@/components/ui/button";

type TabType = 'capture' | 'workflow' | 'social';

interface TabSystemProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
}

const TabSystem: React.FC<TabSystemProps> = ({ activeTab, setActiveTab }) => {
  return (
    <div className="mb-4 flex justify-center border-b pb-2">
      <div className="inline-flex rounded-md shadow-sm">
        <Button
          variant={activeTab === 'capture' ? 'default' : 'outline'}
          className="rounded-r-none"
          onClick={() => setActiveTab('capture')}
        >
          Image Capture
        </Button>
        <Button
          variant={activeTab === 'workflow' ? 'default' : 'outline'}
          className="rounded-l-none rounded-r-none"
          onClick={() => setActiveTab('workflow')}
        >
          RC Workflow
        </Button>
        <Button
          variant={activeTab === 'social' ? 'default' : 'outline'}
          className="rounded-l-none"
          onClick={() => setActiveTab('social')}
        >
          Social Media
        </Button>
      </div>
    </div>
  );
};

export default TabSystem;

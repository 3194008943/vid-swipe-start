import React from "react";
import { Home, Search, Plus, User, MessageCircle, LogOut, Video, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onUploadClick: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  onTabChange,
  onUploadClick,
}) => {
  const navigate = useNavigate();
  
  const tabs = [
    { id: "home", icon: Home, label: "Home" },
    { id: "discover", icon: Search, label: "Discover" },
    { id: "upload", icon: Plus, label: "Upload", special: true },
    { id: "shop", icon: ShoppingBag, label: "Shop" },
    { id: "live", icon: Video, label: "Go Live" },
    { id: "messages", icon: MessageCircle, label: "Messages" },
    { id: "profile", icon: User, label: "Profile" },
  ];

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to log out");
    } else {
      toast.success("Logged out successfully");
      navigate("/auth");
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border">
      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          if (tab.special) {
            return (
              <Button
                key={tab.id}
                variant="gradient"
                size="icon"
                className="h-10 w-14 rounded-xl"
                onClick={onUploadClick}
              >
                <Icon className="h-5 w-5" />
              </Button>
            );
          }
          return (
            <Button
              key={tab.id}
              variant="ghost"
              className={cn(
                "flex flex-col gap-1 h-auto py-2 px-4",
                activeTab === tab.id && "text-primary"
              )}
              onClick={() => onTabChange(tab.id)}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px]">{tab.label}</span>
            </Button>
          );
        })}
        <Button
          variant="ghost"
          className="flex flex-col gap-1 h-auto py-2 px-4 text-destructive"
          onClick={handleLogout}
        >
          <LogOut className="h-5 w-5" />
          <span className="text-[10px]">Logout</span>
        </Button>
      </div>
    </div>
  );
};
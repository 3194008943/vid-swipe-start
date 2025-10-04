import React, { useState, useRef, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { VideoCard } from "@/components/VideoCard";
import { Navigation } from "@/components/Navigation";
import { CommentSheet } from "@/components/CommentSheet";
import { UploadModal } from "@/components/UploadModal";
import { ProfileView } from "@/components/ProfileView";
import { DiscoverView } from "@/components/DiscoverView";
import { UnifiedSettingsView } from "@/components/UnifiedSettingsView";
import MessagesView from "@/components/MessagesView";
import { LiveStreamView } from "@/components/LiveStreamView";
import { PvPBattleView } from "@/components/PvPBattleView";
import { ShopView } from "@/components/ShopView";
import { mockVideos } from "@/data/mockData";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { user, loading } = useAuth();

  useEffect(() => {
    const handleScroll = (e: Event) => {
      const container = e.target as HTMLDivElement;
      const scrollPosition = container.scrollTop;
      const videoHeight = window.innerHeight;
      const newIndex = Math.round(scrollPosition / videoHeight);
      
      if (newIndex !== currentVideoIndex && newIndex < mockVideos.length) {
        setCurrentVideoIndex(newIndex);
      }
    };

    const container = containerRef.current;
    if (container && activeTab === "home") {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, [currentVideoIndex, activeTab]);

  // Listen for settings navigation from ProfileView
  useEffect(() => {
    const handleNavigate = (e: CustomEvent) => {
      if (e.detail === 'settings' || e.detail === 'shop') {
        setActiveTab(e.detail);
      }
    };
    
    window.addEventListener('navigate' as any, handleNavigate);
    return () => window.removeEventListener('navigate' as any, handleNavigate);
  }, []);

  // Redirect to auth if not logged in
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case "home":
        return (
          <div
            ref={containerRef}
            className="h-screen overflow-y-scroll snap-y snap-mandatory"
            style={{ scrollBehavior: "smooth" }}
          >
            {mockVideos.map((video, index) => (
              <div key={video.id} className="h-screen snap-center">
                <VideoCard
                  video={video}
                  isActive={index === currentVideoIndex}
                  onCommentClick={() => setIsCommentOpen(true)}
                />
              </div>
            ))}
          </div>
        );
      case "discover":
        return <DiscoverView />;
      case "live":
        return <LiveStreamView />;
      case "pvp":
        return <PvPBattleView />;
      case "messages":
        return <MessagesView />;
      case "profile":
        return <ProfileView />;
      case "settings":
        return <UnifiedSettingsView onBack={() => setActiveTab('profile')} />;
      case "shop":
        return <ShopView />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen bg-black overflow-hidden relative">
      {renderContent()}
      
      <Navigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onUploadClick={() => setIsUploadOpen(true)}
      />

      <CommentSheet
        isOpen={isCommentOpen}
        onClose={() => setIsCommentOpen(false)}
        videoId={mockVideos[currentVideoIndex]?.id || ""}
      />

      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
      />
    </div>
  );
};

export default Index;

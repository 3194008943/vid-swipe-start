import React, { useState, useRef, useEffect } from "react";
import { VideoCard } from "@/components/VideoCard";
import { Navigation } from "@/components/Navigation";
import { CommentSheet } from "@/components/CommentSheet";
import { UploadModal } from "@/components/UploadModal";
import { ProfileView } from "@/components/ProfileView";
import { DiscoverView } from "@/components/DiscoverView";
import { mockVideos } from "@/data/mockData";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

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
      case "profile":
        return <ProfileView />;
      default:
        return null;
    }
  };

  return (
    <div className="h-screen bg-black overflow-hidden">
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

import React, { useState } from "react";
import { ArrowLeft, Bell, Lock, Palette, User, Globe, Shield, Sparkles, Moon, Sun, Volume2, Vibrate, MessageSquare, Heart, Share2, LogOut } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

export const SettingsView = ({ onBack }: { onBack: () => void }) => {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [soundEffects, setSoundEffects] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);
  const [autoplay, setAutoplay] = useState(true);
  const [privateAccount, setPrivateAccount] = useState(false);
  const [showActivity, setShowActivity] = useState(true);
  const { toast } = useToast();
  const { signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
    toast({
      title: "Signed out successfully",
      description: "See you soon! 👋",
    });
  };

  const toggleDarkMode = (checked: boolean) => {
    setDarkMode(checked);
    document.documentElement.classList.toggle("dark", checked);
    toast({
      title: checked ? "Dark mode enabled 🌙" : "Light mode enabled ☀️",
      description: "Theme updated successfully",
    });
  };

  const settingGroups = [
    {
      title: "Account",
      icon: <User className="h-5 w-5" />,
      items: [
        {
          label: "Edit Profile",
          icon: <User className="h-4 w-4" />,
          action: () => toast({ title: "Opening profile editor...", description: "Feature coming soon!" }),
        },
        {
          label: "Privacy",
          icon: <Lock className="h-4 w-4" />,
          toggle: privateAccount,
          onToggle: setPrivateAccount,
          description: "Make your account private",
        },
        {
          label: "Show Activity Status",
          icon: <Globe className="h-4 w-4" />,
          toggle: showActivity,
          onToggle: setShowActivity,
          description: "Let others see when you're active",
        },
      ],
    },
    {
      title: "Appearance",
      icon: <Palette className="h-5 w-5" />,
      items: [
        {
          label: "Dark Mode",
          icon: darkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />,
          toggle: darkMode,
          onToggle: toggleDarkMode,
          description: "Switch between light and dark themes",
        },
        {
          label: "Cool Effects",
          icon: <Sparkles className="h-4 w-4" />,
          action: () => {
            document.body.classList.add("animate-pulse");
            setTimeout(() => document.body.classList.remove("animate-pulse"), 1000);
            toast({ title: "✨ Effects enabled!", description: "Enjoy the magic!" });
          },
        },
      ],
    },
    {
      title: "Notifications",
      icon: <Bell className="h-5 w-5" />,
      items: [
        {
          label: "Push Notifications",
          icon: <Bell className="h-4 w-4" />,
          toggle: notifications,
          onToggle: setNotifications,
          description: "Receive push notifications",
        },
        {
          label: "Comments",
          icon: <MessageSquare className="h-4 w-4" />,
          toggle: true,
          onToggle: () => {},
          description: "Notify when someone comments",
        },
        {
          label: "Likes",
          icon: <Heart className="h-4 w-4" />,
          toggle: true,
          onToggle: () => {},
          description: "Notify when someone likes your video",
        },
        {
          label: "Shares",
          icon: <Share2 className="h-4 w-4" />,
          toggle: true,
          onToggle: () => {},
          description: "Notify when your video is shared",
        },
      ],
    },
    {
      title: "Playback",
      icon: <Volume2 className="h-5 w-5" />,
      items: [
        {
          label: "Sound Effects",
          icon: <Volume2 className="h-4 w-4" />,
          toggle: soundEffects,
          onToggle: setSoundEffects,
          description: "Enable sound effects",
        },
        {
          label: "Haptic Feedback",
          icon: <Vibrate className="h-4 w-4" />,
          toggle: hapticFeedback,
          onToggle: setHapticFeedback,
          description: "Vibration feedback on interactions",
        },
        {
          label: "Autoplay Videos",
          icon: <Globe className="h-4 w-4" />,
          toggle: autoplay,
          onToggle: setAutoplay,
          description: "Automatically play videos",
        },
      ],
    },
    {
      title: "Security",
      icon: <Shield className="h-5 w-5" />,
      items: [
        {
          label: "Two-Factor Authentication",
          icon: <Shield className="h-4 w-4" />,
          action: () => toast({ title: "2FA Setup", description: "Feature coming soon!" }),
        },
        {
          label: "Login Activity",
          icon: <Globe className="h-4 w-4" />,
          action: () => toast({ title: "Login History", description: "Feature coming soon!" }),
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="flex items-center justify-between p-4">
          <button
            onClick={onBack}
            className="p-2 hover:bg-accent rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            Settings
          </h1>
          <div className="w-9" /> {/* Spacer for centering */}
        </div>
      </div>

      {/* Settings Content */}
      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {settingGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              {group.icon}
              <span>{group.title}</span>
            </div>
            
            <div className="bg-card rounded-xl border shadow-sm overflow-hidden">
              {group.items.map((item, itemIndex) => (
                <div key={itemIndex}>
                  {itemIndex > 0 && <Separator />}
                  <div
                    className={`p-4 ${item.action ? "cursor-pointer hover:bg-accent/50" : ""} transition-colors`}
                    onClick={item.action}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          {item.icon}
                        </div>
                        <div>
                          <p className="font-medium">{item.label}</p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                      {item.toggle !== undefined && (
                        <Switch
                          checked={item.toggle}
                          onCheckedChange={item.onToggle}
                          className="data-[state=checked]:bg-primary"
                        />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Sign Out Button */}
        <div className="pt-6 pb-20">
          <Button
            onClick={handleSignOut}
            variant="outline"
            className="w-full border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground transition-all duration-300 group"
          >
            <LogOut className="h-4 w-4 mr-2 group-hover:rotate-12 transition-transform" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};
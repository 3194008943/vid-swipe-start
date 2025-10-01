import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Swords, Trophy, Gift, Users, Heart, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { formatNumber } from "@/lib/utils";

interface PvPBattle {
  id: string;
  challenger_id: string;
  opponent_id: string;
  challenger_votes: number;
  opponent_votes: number;
  challenger_gifts: number;
  opponent_gifts: number;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  winner_id?: string;
  started_at?: string;
  ended_at?: string;
  challenger?: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
  opponent?: {
    username: string;
    display_name: string;
    avatar_url: string;
  };
}

export const PvPBattleView: React.FC = () => {
  const { user } = useAuth();
  const [battles, setBattles] = useState<PvPBattle[]>([]);
  const [selectedBattle, setSelectedBattle] = useState<PvPBattle | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBattles();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('pvp_battles_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'pvp_battles'
        },
        () => {
          fetchBattles();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchBattles = async () => {
    const { data: battlesData, error } = await supabase
      .from('pvp_battles')
      .select('*')
      .in('status', ['active', 'pending'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching battles:', error);
      return;
    }

    if (!battlesData) {
      setBattles([]);
      return;
    }

    // Fetch profiles for challengers and opponents
    const battlesWithProfiles = await Promise.all(
      battlesData.map(async (battle) => {
        const [challengerProfile, opponentProfile] = await Promise.all([
          supabase
            .from('profiles')
            .select('username, display_name, avatar_url')
            .eq('id', battle.challenger_id)
            .single(),
          supabase
            .from('profiles')
            .select('username, display_name, avatar_url')
            .eq('id', battle.opponent_id)
            .single()
        ]);

        return {
          ...battle,
          challenger: challengerProfile.data || { username: 'Unknown', display_name: 'Unknown', avatar_url: '' },
          opponent: opponentProfile.data || { username: 'Unknown', display_name: 'Unknown', avatar_url: '' }
        } as PvPBattle;
      })
    );

    setBattles(battlesWithProfiles);
  };

  const voteForPlayer = async (battleId: string, playerId: string) => {
    if (!user) {
      toast.error("Please login to vote");
      return;
    }

    const battle = battles.find(b => b.id === battleId);
    if (!battle) return;

    const isChallenger = playerId === battle.challenger_id;
    const updateData = isChallenger
      ? { challenger_votes: battle.challenger_votes + 1 }
      : { opponent_votes: battle.opponent_votes + 1 };

    const { error } = await supabase
      .from('pvp_battles')
      .update(updateData)
      .eq('id', battleId);

    if (error) {
      toast.error("Failed to vote");
      return;
    }

    toast.success("Vote cast! 🗳️");
    fetchBattles();
  };

  const startBattle = async (opponentId: string) => {
    if (!user) {
      toast.error("Please login to start a battle");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase
      .from('pvp_battles')
      .insert({
        challenger_id: user.id,
        opponent_id: opponentId,
        status: 'pending'
      })
      .select()
      .single();

    setLoading(false);

    if (error) {
      toast.error("Failed to create battle");
      return;
    }

    toast.success("Battle challenge sent!");
    fetchBattles();
  };

  const BattleCard = ({ battle }: { battle: PvPBattle }) => {
    const totalVotes = battle.challenger_votes + battle.opponent_votes;
    const challengerPercentage = totalVotes > 0 
      ? (battle.challenger_votes / totalVotes) * 100 
      : 50;
    const opponentPercentage = totalVotes > 0 
      ? (battle.opponent_votes / totalVotes) * 100 
      : 50;

    return (
      <Card className="overflow-hidden">
        <div className="p-6">
          {/* Battle Status */}
          <div className="flex items-center justify-between mb-4">
            <Badge variant={battle.status === 'active' ? 'destructive' : 'secondary'}>
              {battle.status === 'active' ? 'LIVE BATTLE' : battle.status.toUpperCase()}
            </Badge>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="w-4 h-4" />
              {formatNumber(totalVotes)} votes
            </div>
          </div>

          {/* Players */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Challenger */}
            <div className="text-center">
              <Avatar className="w-20 h-20 mx-auto mb-2">
                <AvatarImage src={battle.challenger?.avatar_url} />
                <AvatarFallback>
                  {battle.challenger?.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h3 className="font-semibold">
                {battle.challenger?.display_name || battle.challenger?.username}
              </h3>
              <div className="mt-2 space-y-1">
                <div className="text-2xl font-bold">{challengerPercentage.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">
                  {formatNumber(battle.challenger_votes)} votes
                </div>
                {battle.challenger_gifts > 0 && (
                  <div className="text-sm text-muted-foreground">
                    <Gift className="w-3 h-3 inline mr-1" />
                    ${formatNumber(battle.challenger_gifts)}
                  </div>
                )}
              </div>
            </div>

            {/* VS Divider */}
            <div className="relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="bg-background px-2 py-1">
                  <Swords className="w-6 h-6 text-primary" />
                </div>
              </div>
              <div className="h-full border-l border-border absolute left-1/2 -translate-x-1/2" />
            </div>

            {/* Opponent */}
            <div className="text-center">
              <Avatar className="w-20 h-20 mx-auto mb-2">
                <AvatarImage src={battle.opponent?.avatar_url} />
                <AvatarFallback>
                  {battle.opponent?.username?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <h3 className="font-semibold">
                {battle.opponent?.display_name || battle.opponent?.username}
              </h3>
              <div className="mt-2 space-y-1">
                <div className="text-2xl font-bold">{opponentPercentage.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">
                  {formatNumber(battle.opponent_votes)} votes
                </div>
                {battle.opponent_gifts > 0 && (
                  <div className="text-sm text-muted-foreground">
                    <Gift className="w-3 h-3 inline mr-1" />
                    ${formatNumber(battle.opponent_gifts)}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative h-8 bg-muted rounded-full overflow-hidden mb-4">
            <div 
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-500"
              style={{ width: `${challengerPercentage}%` }}
            />
            <div 
              className="absolute right-0 top-0 h-full bg-gradient-to-l from-red-500 to-red-600 transition-all duration-500"
              style={{ width: `${opponentPercentage}%` }}
            />
          </div>

          {/* Vote Buttons */}
          {battle.status === 'active' && (
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => voteForPlayer(battle.id, battle.challenger_id)}
                className="group"
              >
                <Heart className="w-4 h-4 mr-2 group-hover:text-blue-500" />
                Vote Challenger
              </Button>
              <Button
                variant="outline"
                onClick={() => voteForPlayer(battle.id, battle.opponent_id)}
                className="group"
              >
                <Heart className="w-4 h-4 mr-2 group-hover:text-red-500" />
                Vote Opponent
              </Button>
            </div>
          )}

          {/* Winner Display */}
          {battle.status === 'completed' && battle.winner_id && (
            <div className="text-center py-4 bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 rounded-lg">
              <Trophy className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
              <p className="font-semibold">
                Winner: {battle.winner_id === battle.challenger_id 
                  ? battle.challenger?.display_name 
                  : battle.opponent?.display_name}
              </p>
            </div>
          )}
        </div>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Swords className="w-8 h-8 text-primary" />
              PvP Battles
            </h1>
            <p className="text-muted-foreground mt-1">
              Challenge others and let viewers decide the winner!
            </p>
          </div>
          
          {user && (
            <Button onClick={() => toast.info("Select a user to challenge!")}>
              <Zap className="w-4 h-4 mr-2" />
              Start Battle
            </Button>
          )}
        </div>

        {/* Active Battles */}
        <div>
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Badge variant="destructive">LIVE</Badge>
            Active Battles
          </h2>
          
          {battles.filter(b => b.status === 'active').length === 0 ? (
            <Card className="p-8 text-center">
              <Swords className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No active battles right now</p>
              <p className="text-sm text-muted-foreground mt-1">
                Start a battle to see it here!
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {battles
                .filter(b => b.status === 'active')
                .map(battle => (
                  <BattleCard key={battle.id} battle={battle} />
                ))}
            </div>
          )}
        </div>

        {/* Pending Battles */}
        {battles.filter(b => b.status === 'pending').length > 0 && (
          <div>
            <h2 className="text-xl font-semibold mb-4">Pending Challenges</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {battles
                .filter(b => b.status === 'pending')
                .map(battle => (
                  <BattleCard key={battle.id} battle={battle} />
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
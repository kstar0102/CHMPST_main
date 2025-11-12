import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  ScrollView,
  Image,
  TextInput,
  Keyboard,
  FlatList,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CMNavigationProps from '../navigation/CMNavigationProps';
import CMCommonStyles from '../styles/CMCommonStyles';
import CMConstants from '../CMConstants';
import CMUtils from '../utils/CMUtils';
import CMRipple from '../components/CMRipple';
import CMProfileImage from '../components/CMProfileImage';
import CMFirebaseHelper from '../helper/CMFirebaseHelper';
import firestore from '@react-native-firebase/firestore';

interface LatestScore {
  id: string;
  teamA: string;
  teamB: string;
  scoreA: number;
  scoreB: number;
  round: string;
  game: string;
  series: string;
  leagueId: string;
  leagueName: string;
  leagueLogo: string;
  teamALogo: string;
  teamBLogo: string;
  league?: {
    id: string;
    name: string;
    avatar?: string;
    teamsId?: string[];
    maxTeamSize?: number;
    adminId?: string;
    inviteId?: string;
  };
  topPlayerFromMatch?: {
    id: string;
    name: string;
    avatar?: string;
    points: number;
    teamName: string;
  };
}

interface TopPlayer {
  id: string;
  playerId: string;
  leagueId: string;
  matches: number;
  averagePoints: number;
  averageRebounds: number;
  averageAssists: number;
  averageSteals: number;
  averageBlocks: number;
  averageTurnovers: number;
  player?: {
    id: string;
    name: string;
    number: number;
    position: string;
    avatar?: string;
    teamId?: string;
    height?: number;
    weight?: number;
  };
  team?: {
    id: string;
    name: string;
    avatar?: string;
  };
  league?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

const CMHomeScreen = ({ navigation, route }: CMNavigationProps) => {
  const themeMode = CMConstants.themeMode.light;
  const insets = useSafeAreaInsets();

  // Load more configuration
  const LOAD_MORE_LIMIT = 2;

  const [searchText, setSearchText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [topPlayers, setTopPlayers] = useState<TopPlayer[]>([]);
  const [isLoadingTopPlayers, setIsLoadingTopPlayers] = useState(true);
  const [latestScores, setLatestScores] = useState<LatestScore[]>([]);
  const [isLoadingLatestScores, setIsLoadingLatestScores] = useState(false);

  // Show more state management
  const [latestScoresDisplayCount, setLatestScoresDisplayCount] = useState(LOAD_MORE_LIMIT);
  const [topPlayersDisplayCount, setTopPlayersDisplayCount] = useState(LOAD_MORE_LIMIT);


  // Load top players data
  useEffect(() => {
    loadTopPlayers();
    loadLatestScores();
  }, []);

  // Reload latest scores when screen comes into focus (e.g., after adding stats)
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadLatestScores();
      // Also refresh Top Players so averages reflect recent stat changes
      loadTopPlayers();
    });

    return unsubscribe;
  }, [navigation]);

  // Function to get latest match with top player data for a league using Firebase helper
  const getLatestMatchWithTopPlayer = (leagueId: string): Promise<any> => {
    return new Promise((resolve) => {
      CMFirebaseHelper.getLatestMatchByLeague(leagueId, (response: {[name: string]: any}) => {
        if (response.isSuccess) {
          resolve(response.value);
        } else {
          console.log('Error fetching latest match for league:', leagueId, response.value);
          resolve(null);
        }
      });
    });
  };

  const loadLatestScores = () => {
    setIsLoadingLatestScores(true);
    console.log('Loading latest scores...');

    // Step 1: Fetch all leagues
    CMFirebaseHelper.getAllLeagues(async (leaguesResponse: any) => {
      if (leaguesResponse.isSuccess) {
        const leagues = leaguesResponse.value;
        console.log('Leagues fetched:', leagues.length);
        const latestScoresData: LatestScore[] = [];

        if (leagues.length === 0) {
          console.log('No leagues found');
          setLatestScores([]);
          setIsLoadingLatestScores(false);
          return;
        }

        // Step 2-5: For each league, get latest match and team details
        let completedLeagues = 0;
        const totalLeagues = leagues.length;

        for (const league of leagues) {
          console.log('Fetching matches for league:', league.id, league.name);
          const match = await getLatestMatchWithTopPlayer(league.id);

          if (match) {
            console.log('Match found for league:', league.name, match);
            console.log('Match topPlayerFromMatch:', match.topPlayerFromMatch);
            console.log('Match topScorePlayerId:', match.topScorePlayerId);
            console.log('Match topScore:', match.topScore);

            try {
              // Get team A details
              const teamAResponse = await new Promise<any>((resolve) => {
                CMFirebaseHelper.getTeamById(match.teamAId, resolve);
              });

              // Get team B details
              const teamBResponse = await new Promise<any>((resolve) => {
                CMFirebaseHelper.getTeamById(match.teamBId, resolve);
              });

              if (teamAResponse.isSuccess && teamBResponse.isSuccess) {
                const teamAData = teamAResponse.value;
                const teamBData = teamBResponse.value;

                // Create location string from league data
                const leagueLocation = [league.city, league.state].filter(Boolean).join(', ');
                console.log('League location data:', { city: league.city, state: league.state, country: league.country, leagueLocation });
                
                const scoreItem = {
                  id: match.id,
                  teamA: teamAData.name || 'Unknown Team',
                  teamB: teamBData.name || 'Unknown Team',
                  scoreA: match.teamAScore || 0,
                  scoreB: match.teamBScore || 0,
                  round: 'Match', // Use generic text since round doesn't exist in DB
                  game: match.name || 'Match', // Use match name since game doesn't exist
                  series: leagueLocation || match.location || 'Arena', // Use league location (city, state) or match location as fallback
                  leagueId: league.id || '',
                  leagueName: league.name || 'Unknown League',
                  leagueLogo: league.avatar || '',
                  teamALogo: teamAData.avatar || '',
                  teamBLogo: teamBData.avatar || '',
                  league: {
                    id: league.id || '',
                    name: league.name || 'Unknown League',
                    avatar: league.avatar || '',
                    teamsId: league.teamsId || [],
                    maxTeamSize: league.maxTeamSize || 8,
                    adminId: league.adminId || '',
                    inviteId: league.inviteId || '',
                  },
                  topPlayerFromMatch: match.topPlayerFromMatch,
                };
                
                console.log('Pushing score item for league:', league.name, 'with topPlayerFromMatch:', scoreItem.topPlayerFromMatch);
                latestScoresData.push(scoreItem);
              }
            } catch (error) {
              console.log('Error fetching team details for league:', league.name, error);
            }
          } else {
            console.log('No match found for league:', league.name);
          }
        }

        // Sort by highest scores first
        latestScoresData.sort((a, b) => {
          const totalScoreA = (a.scoreA || 0) + (a.scoreB || 0);
          const totalScoreB = (b.scoreA || 0) + (b.scoreB || 0);
          return totalScoreB - totalScoreA;
        });

        console.log('Final latest scores data:', JSON.stringify(latestScoresData, null, 2));
        setLatestScores(latestScoresData);
        setIsLoadingLatestScores(false);
      } else {
        setLatestScores([]);
        setIsLoadingLatestScores(false);
      }
    });
  };


  const loadTopPlayers = () => {
    setIsLoadingTopPlayers(true);

    // Step 1: Fetch all leagues
    CMFirebaseHelper.getAllLeagues((leaguesResponse: any) => {
      if (leaguesResponse.isSuccess) {
        const leagues = leaguesResponse.value;
        const topPlayers: TopPlayer[] = [];
        let completedLeagues = 0;
        const totalLeagues = leagues.length;

        if (totalLeagues === 0) {
          setTopPlayers([]);
          setIsLoadingTopPlayers(false);
          return;
        }

        // Step 2-6: For each league, get top player based on most recently updated match (to mirror Latest Scores)
        leagues.forEach((league: any) => {
          const handleDone = () => {
            completedLeagues++;
            if (completedLeagues === totalLeagues) {
              // Sort all top players by points
              topPlayers.sort((a: TopPlayer, b: TopPlayer) => (b.averagePoints || 0) - (a.averagePoints || 0));
              setTopPlayers(topPlayers);
              setIsLoadingTopPlayers(false);
            }
          };

          // 1) Try to use latest match top scorer, same as Latest Scores section
          CMFirebaseHelper.getLatestMatchByLeague(league.id, (latestMatchResp: any) => {
            if (latestMatchResp.isSuccess && latestMatchResp.value && latestMatchResp.value.topPlayerFromMatch) {
              const top = latestMatchResp.value.topPlayerFromMatch;
              // Fetch full player + team so UI renders consistently
              CMFirebaseHelper.getPlayerWithTeam(top.id, (playerResponse: any) => {
                if (playerResponse.isSuccess) {
                  const playerData = playerResponse.value;
                  topPlayers.push({
                    id: `${league.id}${top.id}`,
                    playerId: top.id,
                    leagueId: league.id,
                    matches: 1,
                    averagePoints: top.points || 0, // show match points as the metric
                    averageAssists: 0,
                    averageRebounds: 0,
                    averageSteals: 0,
                    averageBlocks: 0,
                    averageTurnovers: 0,
                    player: {
                      id: playerData.id,
                      name: playerData.name,
                      number: playerData.number,
                      position: playerData.position,
                      avatar: playerData.avatar,
                      teamId: playerData.teamId,
                      height: playerData.height,
                      weight: playerData.weight,
                    },
                    team: playerData.team,
                    league: league,
                  });
                }
                handleDone();
              });
            } else {
              // 2) Fallback to averages (existing behavior) if no latest top scorer exists
              CMFirebaseHelper.getPlayerAverageStatsByLeague(league.id, (statsResponse: any) => {
                if (statsResponse.isSuccess && Array.isArray(statsResponse.value) && statsResponse.value.length > 0) {
                  const playerStats = statsResponse.value;
                  const playersSortedByPoints = [...playerStats].sort((a: any, b: any) => (b.averagePoints || 0) - (a.averagePoints || 0));
                  const topPlayerStat = playersSortedByPoints[0];
                  CMFirebaseHelper.getPlayerWithTeam(topPlayerStat.playerId, (playerResponse: any) => {
                    if (playerResponse.isSuccess) {
                      const playerData = playerResponse.value;
                      topPlayers.push({
                        id: topPlayerStat.id || '',
                        playerId: topPlayerStat.playerId || '',
                        leagueId: topPlayerStat.leagueId || '',
                        matches: topPlayerStat.matches || 0,
                        averagePoints: topPlayerStat.averagePoints || 0,
                        averageAssists: topPlayerStat.averageAssists || 0,
                        averageRebounds: topPlayerStat.averageRebounds || 0,
                        averageSteals: topPlayerStat.averageSteals || 0,
                        averageBlocks: topPlayerStat.averageBlocks || 0,
                        averageTurnovers: topPlayerStat.averageTurnovers || 0,
                        player: {
                          id: playerData.id,
                          name: playerData.name,
                          number: playerData.number,
                          position: playerData.position,
                          avatar: playerData.avatar,
                          teamId: playerData.teamId,
                          height: playerData.height,
                          weight: playerData.weight,
                        },
                        team: playerData.team,
                        league: league,
                      });
                    }
                    handleDone();
                  });
                } else {
                  handleDone();
                }
              });
            }
          });
        });
      } else {
        setTopPlayers([]);
        setIsLoadingTopPlayers(false);
      }
    });
  };



  const renderLatestScoreItem = ({ item }: { item: LatestScore }) => {
    console.log('Rendering latest score item:', item.id, 'topPlayerFromMatch:', item.topPlayerFromMatch);
    console.log('Item details:', {
      leagueName: item.leagueName,
      teamA: item.teamA,
      teamB: item.teamB,
      scoreA: item.scoreA,
      scoreB: item.scoreB,
      hasTopPlayer: !!item.topPlayerFromMatch
    });
    
    return (
    <CMRipple
      containerStyle={[styles.topPlayerCardContent, { marginBottom: CMConstants.space.smallEx }]}
      onPress={() => {
        // Navigate to league detail screen
        navigation.navigate(CMConstants.screenName.leagueDetails, {
          league: item.league
        });
      }}
    >



      <View style={styles.scoreRow}>
        <CMProfileImage
          radius={50}
          style={[styles.topPlayerProfileImage, { marginLeft: CMConstants.space.smallEx }]}
          imgURL={item.leagueLogo}
        />
        {/* Match Details */}
        <View style={{ flex: 1, marginHorizontal: 10 }}>
          <Text style={styles.scoreSubtitle}>
            {item.game} (<Text style={{ fontWeight: 'bold' }}>{item.leagueName}</Text> - {item.series})
          </Text>

          {/* Team A */}
          <View style={styles.teamRow}>
            <View style={styles.teamLeft}>

              <CMProfileImage
                radius={20}
                imgURL={item.teamALogo}
              />
              <Text style={styles.teamName}>{item.teamA}</Text>
            </View>
            <Text style={styles.teamScore}>{item.scoreA}</Text>
          </View>

          {/* Team B */}
          <View style={styles.teamRow}>
            <View style={styles.teamLeft}>

              <CMProfileImage
                radius={20}
                imgURL={item.teamBLogo}
              />
              <Text style={styles.teamName}>{item.teamB}</Text>
            </View>
            <Text style={styles.teamScore}>{item.scoreB}</Text>
          </View>

          {/* Top Player from Match */}
          {item.topPlayerFromMatch && (
            <View style={styles.topPlayerFromMatchContainer}>
              <View style={styles.topPlayerFromMatchInfo}>
                <CMProfileImage
                  radius={20}
                  imgURL={item.topPlayerFromMatch.avatar}
                  isUser={true}
                />
                <Text style={styles.topPlayerFromMatchName}>
                  <Text style={{ fontWeight: '700', color: CMConstants.color.grey }}>
                    {item.topPlayerFromMatch.name}
                  </Text>
                  <Text style={{ fontSize: 9, color: CMConstants.color.denim }}>
                    {' '}{item.topPlayerFromMatch.points} pts
                  </Text>
                  
                </Text>
              </View>

            </View>
          )}
        </View>
      </View>
    </CMRipple>
    );
  };




  return (
    <SafeAreaView style={CMCommonStyles.bodyMain(themeMode)}>
      {/* Header */}
      <View
        style={{
          height: CMConstants.height.navBar,
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'row',
          marginTop: CMUtils.isAndroid ? insets.top : 0,
          marginHorizontal: CMConstants.space.normal,
        }}
      >
        {!isSearching ? (
          <>
            <Image
              style={{
                width: '100%',
                height: 50,
              }}
              source={require('../../assets/images/logo.png')}
              resizeMode="contain"
            />
            <CMRipple
              containerStyle={{
                ...CMCommonStyles.circle(CMConstants.height.iconBig),
                position: 'absolute',
                justifyContent: 'center',
                alignItems: 'center',
                right: 0,
              }}
              onPress={() => {
                setIsSearching(true);
              }}
            >
              <Ionicons
                name={'search-outline'}
                size={CMConstants.height.icon}
                color={CMConstants.color.black}
              />
            </CMRipple>
          </>
        ) : (
          <>
            <TextInput
              style={{
                ...CMCommonStyles.textInput(themeMode),
                borderRadius: CMConstants.height.textInput / 2,
                paddingHorizontal: CMConstants.space.small,
                flex: 1,
              }}
              defaultValue={searchText}
              onChangeText={text => setSearchText(text)}
              placeholder="Search"
              placeholderTextColor={CMConstants.color.grey}
              keyboardType="default"
              onSubmitEditing={Keyboard.dismiss}
              blurOnSubmit={false}
              underlineColorAndroid="#f000"
              returnKeyType="done"
            />
            <CMRipple
              containerStyle={{
                ...CMCommonStyles.circle(CMConstants.height.iconBig),
                position: 'absolute',
                justifyContent: 'center',
                alignItems: 'center',
                right: CMConstants.space.smallEx,
              }}
              onPress={() => {
                setIsSearching(false);
              }}
            >
              <Ionicons
                name={'close-circle-outline'}
                size={CMConstants.height.icon}
                color={CMConstants.color.black}
              />
            </CMRipple>
          </>
        )}
      </View>

      <ScrollView
        style={{ flex: 1, marginHorizontal: 15 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Latest Scores Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Latest Scores</Text>
            <CMRipple
              containerStyle={styles.arrowButton}
              onPress={() => {
                navigation.navigate('Activity Feed');
              }}
            >

            </CMRipple>
          </View>

          {isLoadingLatestScores ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading latest scores...</Text>
            </View>
          ) : latestScores.length > 0 ? (
            <>
              <FlatList
                data={latestScores.slice(0, latestScoresDisplayCount)}
                renderItem={renderLatestScoreItem}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                contentContainerStyle={{ width: '100%' }}
                ItemSeparatorComponent={() => <View style={{ height: 2 }} />}
              />
              {latestScores.length > latestScoresDisplayCount && (
                <CMRipple
                  containerStyle={styles.showMoreButton}
                  onPress={() => {
                    setLatestScoresDisplayCount(prev => Math.min(prev + LOAD_MORE_LIMIT, latestScores.length));
                  }}
                >
                  <Text style={styles.showMoreText}>Show More</Text>
                </CMRipple>
              )}
            </>
          ) : (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>No latest scores available</Text>
            </View>
          )}
        </View>

        {/* Top Players Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Top Players</Text>
            <CMRipple
              containerStyle={styles.arrowButton}
              onPress={() => {
                navigation.navigate(CMConstants.screenName.players);
              }}
            >

            </CMRipple>
          </View>

          {/* Top Players List - Similar to CMPlayerStatCell */}
          <View style={styles.topPlayersList}>
            {isLoadingTopPlayers ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading top players...</Text>
              </View>
            ) : topPlayers.length > 0 ? (
              <>
                {topPlayers.slice(0, topPlayersDisplayCount).map((player, index) => (
                  <View key={player.id} style={{ marginBottom: CMConstants.space.smallEx }}>
                    <CMRipple
                      containerStyle={[styles.topPlayerScoreRow, { paddingVertical: 10, alignItems: 'center' }]}
                      onPress={() => {
                        // Navigate to player details screen
                        navigation.navigate(CMConstants.screenName.playerDetails, {
                          player: player.player,
                          team: player.team,
                          league: player.league
                        });
                      }}
                    >
                      <View style={{ width: 10 }}></View>
                      <CMProfileImage
                        radius={50}
                        style={[styles.topPlayerProfileImage]}
                        imgURL={player.league?.avatar}
                      />
                      <View style={{ width: 5 }}></View>
                      {/* Player Profile Image */}
                      <CMProfileImage
                        radius={35}
                        style={styles.topPlayerProfileImage}
                        imgURL={player.player?.avatar}
                        isUser={true}
                      />

                      {/* Player Info */}
                      <View style={styles.topPlayerInfoContainer}>
                        <Text style={styles.topPlayerName} numberOfLines={2}>
                          {player.player?.name || 'Unknown Player'}
                        </Text>

                        <View style={styles.topPlayerTeamRow}>
                          <CMProfileImage
                            radius={20}
                            imgURL={player.team?.avatar}
                          />
                          <View style={styles.topPlayerTeamInfo}>
                            <Text style={styles.topPlayerTeamName} numberOfLines={1}>
                              {player.team?.name || 'Unknown Team'}
                            </Text>
                          </View>
                        </View>
                      </View>

                      {/* Stats */}
                      <View style={styles.topPlayerStatsContainer}>
                        <View>
                          <Text style={styles.topPlayerStatTitle}>
                            P
                          </Text>
                          <Text style={styles.topPlayerStatValue}>
                            {Math.round(player.averagePoints)}
                          </Text></View>
                        <View>
                          <Text style={styles.topPlayerStatTitle}>
                            A
                          </Text>
                          <Text style={styles.topPlayerStatValue}>
                            {Math.round(player.averageAssists)}
                          </Text>
                        </View>
                        <View>
                          <Text style={styles.topPlayerStatTitle}>
                            R
                          </Text>
                          <Text style={styles.topPlayerStatValue}>
                            {Math.round(player.averageRebounds)}
                          </Text>
                        </View>
                        <View>
                          <Text style={styles.topPlayerStatTitle}>
                            B
                          </Text>
                          <Text style={styles.topPlayerStatValue}>
                            {Math.round(player.averageBlocks)}
                          </Text>
                        </View>
                        <View>
                          <Text style={styles.topPlayerStatTitle}>
                            S
                          </Text>
                          <Text style={styles.topPlayerStatValue}>
                            {Math.round(player.averageSteals)}
                          </Text>
                        </View>
                      </View>
                    </CMRipple>
                  </View>
                ))}
                {topPlayers.length > topPlayersDisplayCount && (
                  <CMRipple
                    containerStyle={styles.showMoreButton}
                    onPress={() => {
                      setTopPlayersDisplayCount(prev => Math.min(prev + LOAD_MORE_LIMIT, topPlayers.length));
                    }}
                  >
                    <Text style={styles.showMoreText}>Show More</Text>
                  </CMRipple>
                )}
              </>
            ) : (
              <View style={styles.noDataContainer}>
                <Text style={styles.noDataText}>No top players found</Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = {
  section: {
    marginBottom: CMConstants.space.normal,
  },
  sectionHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: CMConstants.space.smallEx,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: CMConstants.color.black,
  },
  arrowButton: {
    ...CMCommonStyles.circle(CMConstants.height.iconBig),
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },

  scoreItem: {
    flexDirection: 'column' as const,
  },
  scoreHeader: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: CMConstants.space.smallEx,
  },
  scoreContent: {
    flexDirection: 'column' as const,
  },


  playerCard: {
    backgroundColor: CMConstants.color.lightGrey2,
    borderRadius: CMConstants.radius.small,
    padding: CMConstants.space.small,
    marginBottom: CMConstants.space.smallEx,
  },
  playerItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: CMConstants.space.small,
  },
  playerLeft: {
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    marginRight: CMConstants.space.small,
    width: 60,
  },
  playerIconContainer: {
    marginBottom: CMConstants.space.smallEx,
    width: 32,
    height: 32,
  },
  playerIcon: {
    width: 28,
    height: 28,
  },
  playerProfileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: CMConstants.color.lightGrey2,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  playerInfo: {
    flex: 1,
    marginLeft: CMConstants.space.small,
  },
  playerTeamRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginTop: 4,
  },

  teamLogoText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold' as const,
  },
  playerFirstName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: CMConstants.color.black,
    marginBottom: 0,
  },
  playerLastName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: CMConstants.color.black,
    marginBottom: 2,
  },
  playerTeam: {
    fontSize: 12,
    color: CMConstants.color.grey,
  },
  playerStats: {
    flexDirection: 'column' as const,
    alignItems: 'flex-end' as const,
    justifyContent: 'center' as const,
    flex: 1,
    paddingRight: 8,
  },
  statValue: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: CMConstants.color.black,
    textAlign: 'right' as const,
    marginBottom: 2,
  },
  scoreCard: {
    borderRadius: CMConstants.radius.small,
    flexDirection: 'row' as const,
    marginHorizontal: 1,
    marginBottom: CMConstants.space.smallEx,
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const
  },

  scoreRow: {
    flexDirection: 'row' as const,
    backgroundColor: CMConstants.color.lightGrey2,
    flex: 1,
    borderWidth: 1,
    borderRadius: CMConstants.radius.normal,
    borderColor: CMConstants.color.lightGrey,
    overflow: 'hidden' as const,
    alignItems: 'center' as const,
    paddingHorizontal: CMConstants.space.smallEx,
    paddingVertical: CMConstants.space.smallEx,
  },
  topPlayersCard: {
    width: '100%',
  },

  topPlayerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    marginBottom: 10,
    borderRadius: CMConstants.radius.small,
  },

  topPlayerInfo: {
    flex: 1,
  },

  leagueIconContainer: {
    width: 32,
    height: 32,
    marginRight: 20,
    backgroundColor: CMConstants.color.lightGrey2,
    borderRadius: CMConstants.radius.small,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    alignSelf: 'center' as const,
  },

  leagueIcon: {
    width: 45,
    height: 45,
    borderRadius: 50,
  },

  champLogo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: CMConstants.color.denim,
    justifyContent: 'center',
    alignItems: 'center',
  },

  champText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: 'white',
  },

  scoreSubtitle: {
    fontSize: 12,
    color: CMConstants.color.black,
    marginBottom: 2,

  },

  teamRow: {
    flexDirection: 'row' as const,
    justifyContent: 'space-between' as const,
    alignItems: 'center' as const,
    marginBottom: 2,
  },

  teamLeft: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },

  teamLogo: {
    width: 16,
    height: 16,
    marginRight: 4,
    borderRadius: 50,
  },

  teamName: {
    fontSize: 12,
    fontWeight: '500' as const,
    paddingVertical: 4,
    color: CMConstants.color.black,
    marginLeft: 4,
  },

  teamScore: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: CMConstants.color.black,
  },

  // Top Players List Styles (similar to CMPlayerStatCell)
  topPlayersList: {
    width: '100%' as const,
  },
  topPlayerCard: {
    borderRadius: CMConstants.radius.small,
    flexDirection: 'row' as const,
    marginHorizontal: 1,
    marginBottom: CMConstants.space.smallEx,
    flex: 1,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  topPlayerScoreRow: {
    flexDirection: 'row' as const,
    backgroundColor: CMConstants.color.lightGrey2,
    flex: 1,
    padding: 2,
    borderWidth: 1,
    borderRadius: CMConstants.radius.normal,
    borderColor: CMConstants.color.lightGrey,
    overflow: 'hidden' as const,
  },
  topPlayerCardContent: {
    flex: 1,
    alignItems: 'center' as const,
    flexDirection: 'row' as const,
    backgroundColor: 'transparent',
  },
  topPlayerProfileImage: {
  },
  topPlayerInfoContainer: {
    flex: 1,
    marginLeft: CMConstants.space.smallEx,
  },
  topPlayerName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: CMConstants.color.black,
    marginBottom: 2,
  },
  topPlayerLeagueName: {
    fontSize: 12,
    fontWeight: '500' as const,
    color: CMConstants.color.denim,
    marginBottom: 4,
  },
  topPlayerTeamRow: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  topPlayerTeamInfo: {
    flex: 1,
    marginLeft: 4,
    justifyContent: 'center' as const,
  },
  topPlayerTeamName: {
    fontSize: 12,
    color: CMConstants.color.grey,
  },
  topPlayerStatsContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  topPlayerStatValue: {
    width: 35,
    textAlign: 'center' as const,
    fontSize: 10,
    fontWeight: '400' as const,
    color: CMConstants.color.black,
  },
  topPlayerStatTitle: {
    width: 35,
    textAlign: 'center' as const,
    fontSize: 12,
    fontWeight: '700' as const,
    color: CMConstants.color.black,
    marginBottom: 2,
  },
  performanceScoreContainer: {
    alignItems: 'center' as const,
    marginLeft: CMConstants.space.small,
    paddingHorizontal: CMConstants.space.small,
    paddingVertical: CMConstants.space.smallEx,
    backgroundColor: CMConstants.color.denim,
    borderRadius: CMConstants.radius.small,
  },
  performanceScoreLabel: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: CMConstants.color.white,
    marginBottom: 2,
  },
  performanceScoreValue: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: CMConstants.color.white,
  },
  loadingContainer: {
    padding: CMConstants.space.normal,
    alignItems: 'center' as const,
  },
  loadingText: {
    fontSize: 14,
    color: CMConstants.color.grey,
  },
  showMoreButton: {
    alignSelf: 'flex-end' as const,
    paddingVertical: 5,
  },
  showMoreText: {
    fontSize: 14,
    fontWeight: '500' as const,
    color: CMConstants.color.denim,
    textDecorationLine: 'underline' as const,
  },
  noDataContainer: {
    padding: CMConstants.space.normal,
    alignItems: 'center' as const,
  },
  noDataText: {
    fontSize: 14,
    color: CMConstants.color.grey,
  },
  topPlayerFromMatchContainer: {
    paddingTop: 8,
    paddingBottom: 5,
    paddingHorizontal: 8,
    marginTop: 5,
    backgroundColor: CMConstants.color.lightGrey2,
    borderRadius: 6,
    borderTopWidth: 1,
    borderTopColor: CMConstants.color.lightGrey,
  },
  topPlayerFromMatchInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  topPlayerFromMatchName: {
    fontSize: 10,
    fontWeight: '600' as const,
    color: CMConstants.color.denim,
    marginLeft: 8,
    flex: 1,
  },
  topPlayerFromMatchStats: {
    alignItems: 'flex-start' as const,
  },
  topPlayerFromMatchStat: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: CMConstants.color.denim,
    backgroundColor: CMConstants.color.white,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
};

export default CMHomeScreen;


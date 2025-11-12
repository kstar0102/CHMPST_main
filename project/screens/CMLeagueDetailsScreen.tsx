import React, { useState, useEffect } from 'react';
import { SafeAreaView, View, ViewStyle, Text, FlatList, Linking, Alert } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToast } from 'react-native-toast-notifications';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CMNavigationProps from '../navigation/CMNavigationProps';
import CMCommonStyles from '../styles/CMCommonStyles';
import CMConstants from '../CMConstants';
import CMFirebaseHelper from '../helper/CMFirebaseHelper';
import CMTeamCell from '../components/CMTeamCell';
import CMStandingCell from '../components/CMStandingCell';
import CMPlayerStatCell from '../components/CMPlayerStatCell';
import CMRipple from '../components/CMRipple';
import CMToast from '../components/CMToast';
import CMProfileImage from '../components/CMProfileImage';
import CMAlertDlgHelper from '../helper/CMAlertDlgHelper';

const CMLeagueDetailsScreen = ({ navigation, route }: CMNavigationProps) => {
  const [teams, setTeams] = useState<{ [name: string]: any }[]>([]);
  const [standings, setStandings] = useState<{ [name: string]: any }[]>([]);
  const [playerStats, setPlayerStats] = useState<{ [name: string]: any }[]>([]);

  const [players, setPlayers] = useState<{ [name: string]: any }[]>([]);

  const [refreshingTeams, setRefreshingTeams] = useState(false);
  const [refreshingStandings, setRefreshingStandings] = useState(false);
  const [refreshingStats, setRefreshingStats] = useState(false);
  const [statsIndex, setStatsIndex] = useState(0);

  const insets = useSafeAreaInsets();
  const toast = useToast();

  const themeMode = CMConstants.themeMode.light;
  const Tab = createMaterialTopTabNavigator();

  const league = route.params.league;

  // Generic URL opening function
  const openUrl = async (url: string, platform: string) => {
    if (!url || url.trim().length === 0) {
      Alert.alert('No URL', `No ${platform} URL available for this league.`);
      return;
    }

    try {
      let finalUrl = url.trim();
      
      // Handle Instagram URLs - convert @username to full URL
      if (platform === 'Instagram' && finalUrl.startsWith('@')) {
        const username = finalUrl.substring(1);
        finalUrl = `https://instagram.com/${username}`;
      }
      
      // Handle Facebook URLs - convert @username to full URL if needed
      if (platform === 'Facebook' && finalUrl.startsWith('@')) {
        const username = finalUrl.substring(1);
        finalUrl = `https://facebook.com/${username}`;
      }

      // Check if the URL is valid
      const supported = await Linking.canOpenURL(finalUrl);
      if (supported) {
        await Linking.openURL(finalUrl);
      } else {
        Alert.alert('Error', `Cannot open ${platform} URL. Please check if the URL is valid.`);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to open ${platform} URL.`);
    }
  };

  const loadPlayers = (teamsId: string[]) => {
    CMFirebaseHelper.getPlayers(
      teamsId,
      (response: { [name: string]: any }) => {
        if (response.isSuccess) {
          setPlayers(response.value);
        }
      },
    );
  };

  const loadTeams = (teamsId: string[]) => {
    setRefreshingTeams(true);
    CMFirebaseHelper.getTeams(teamsId, (response: { [name: string]: any }) => {
      setRefreshingTeams(false);
      if (response.isSuccess) {
        setTeams(response.value);
      }
    });
  };

  const loadStandings = () => {
    setRefreshingStandings(true);
    CMFirebaseHelper.getMatches(
      league.id,
      (response: { [name: string]: any }) => {
        setRefreshingStandings(false);
        if (response.isSuccess) {
          const data: { [name: string]: any } = {};
          teams.forEach(team => {
            data[team.id] = { team: team, game: 0, win: 0, lose: 0 };
          });
          response.value.forEach((match: { [name: string]: any }) => {
            const teamA = data[match.teamAId] ?? { game: 0, win: 0, lose: 0 };
            const teamB = data[match.teamBId] ?? { game: 0, win: 0, lose: 0 };
            teamA['game']++;
            teamB['game']++;
            if (match.teamAScore > match.teamBScore) {
              teamA['win']++;
              teamB['lose']++;
            } else {
              teamA['lose']++;
              teamB['win']++;
            }
            data[match.teamAId] = teamA;
            data[match.teamBId] = teamB;
          });

          const standings: { [name: string]: any }[] = [];
          for (let key in data) {
            standings.push(data[key]);
          }

          standings.sort((standing1, standing2) => {
            if (standing1.win > standing2.win) {
              return -1;
            } else if (standing1.win < standing2.win) {
              return 1;
            } else {
              return standing1.lose - standing2.lose;
            }
          });

          setStandings(standings);
        }
      },
    );
  };

  const loadPlayerStats = () => {
    setRefreshingStats(true);

    // Read league-specific stats from players collection
    // This will show the live stats from the scoreboard for this specific league
    const data: { [name: string]: any } = {};
    players.forEach(player => {
      const team = teams.find(team => team.id == player.teamId);

      // Get league-specific stats
      const leagueStats = player.leagueStats?.[league.id] || {};

      data[player.id] = {
        player: player,
        team: team,
        points: leagueStats.points || 0,
        assists: leagueStats.assists || 0,
        rebounds: leagueStats.rebounds || 0,
        blocks: leagueStats.blocks || 0,
        steals: leagueStats.steals || 0,
        matchCount: 1, // Since we're reading current stats, not historical
      };
    });

    const stats: { [name: string]: any }[] = [];
    for (let key in data) {
      stats.push(data[key]);
    }

    stats.sort((stat1, stat2) => {
      return stat2.points - stat1.points;
    });

    setPlayerStats(stats);
    setRefreshingStats(false);
  };

  useEffect(() => {
    navigation.setOptions({ title: league.name });

    loadTeams(league.teamsId ?? []);
    loadPlayers(league.teamsId ?? []);
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Reload teams when screen comes into focus (e.g., returning from add team screen)
      loadTeams(league.teamsId ?? []);
    });

    return unsubscribe;
  }, [navigation, league.teamsId]);

  useEffect(() => {
    if (teams.length > 0) {
      loadStandings();
    } else {
      setStandings([]);
    }
  }, [teams]);

  useEffect(() => {
    if (players.length > 0) {
      loadPlayerStats();
    } else {
      setPlayerStats([]);
    }
  }, [players]);

  const onEditTeam = (team: {[name: string]: any}) => {
    navigation.navigate(CMConstants.screenName.editTeam, {
      isEdit: true,
      team: team
    });
  };

  const onDeleteTeam = (team: {[name: string]: any}) => {
    CMAlertDlgHelper.showConfirmAlert(
      'Delete Team',
      `Are you sure you want to delete "${team.name}"? This will permanently delete the team and ALL associated data. This action cannot be undone.`,
      (confirmed: boolean) => {
        if (confirmed) {
          CMFirebaseHelper.deleteTeamWithAssociatedData(team.id, (response: {[name: string]: any}) => {
            if (response.isSuccess) {
              CMToast.makeText(toast, response.value);
              // Reload teams list after successful deletion
              loadTeams(league.teamsId ?? []);
            } else {
              CMToast.makeText(toast, response.value);
            }
          });
        }
      }
    );
  };

  const onViewTeam = (team: {[name: string]: any}) => {
    navigation.navigate(CMConstants.screenName.teamManagement, {
      team: team
    });
  };

  const TeamsTab = () => {
    return (
      <View
        style={{
          flex: 1,
          paddingHorizontal: CMConstants.space.small,
          backgroundColor: CMConstants.color.white,
        }}
      >
        <CMRipple
          containerStyle={{
            backgroundColor: CMConstants.color.black,
            paddingVertical: CMConstants.space.smallEx,
            paddingHorizontal: CMConstants.space.normal,
            borderRadius: CMConstants.radius.small,
            marginVertical: CMConstants.space.smallEx,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onPress={() => {
            navigation.navigate(CMConstants.screenName.editTeam, {
              isEdit: false,
              league: league,
              team: {}
            });
          }}
        >
          <Text
            style={{
              color: CMConstants.color.white,
              fontSize: CMConstants.fontSize.normal,
                fontFamily: CMConstants.font.semiBold,
            }}
          >
            Add Team
          </Text>
        </CMRipple>
        
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingVertical: CMConstants.space.smallEx,
          }}
        >
          <Text style={CMCommonStyles.label(themeMode)}>All teams</Text>
          <Text style={CMCommonStyles.label(themeMode)}>
            {(league.teamsId ?? []).length}/{league.maxTeamSize} joined
          </Text>
        </View>
        <FlatList
          style={{ flex: 0, marginBottom: insets.bottom }}
          refreshing={refreshingTeams}
          onRefresh={() => {
            loadTeams(league.teamsId ?? []);
          }}
          initialNumToRender={teams.length}
          data={teams.filter(team => team.name != null)}
          renderItem={({ item, separators }) => (
            <CMTeamCell
              team={item}
              onPress={() => {
                navigation.navigate(CMConstants.screenName.players, {
                  team: item,
                  players: players.filter(player => {
                    return player.teamId == item.id;
                  }),
                });
              }}
              onView={() => onViewTeam(item)}
              onEdit={() => onEditTeam(item)}
              onDelete={() => onDeleteTeam(item)}
            />
          )}
          ItemSeparatorComponent={({ highlighted }) => (
            <View style={{ height: CMConstants.space.smallEx }} />
          )}
        />
      </View>
    );
  };

  const StandingsTab = () => {
    return (
      <View
        style={{
          flex: 1,
          paddingHorizontal: CMConstants.space.small,
          backgroundColor: CMConstants.color.white,
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            paddingVertical: CMConstants.space.smallEx,
          }}
        >
          <Text style={{ ...CMCommonStyles.label(themeMode), flex: 1 }}>
            Team
          </Text>
          <Text
            style={{
              ...CMCommonStyles.label(themeMode),
              width: 50,
              textAlign: 'center',
            }}
          >
            G
          </Text>
          <Text
            style={{
              ...CMCommonStyles.label(themeMode),
              width: 50,
              textAlign: 'center',
            }}
          >
            W
          </Text>
          <Text
            style={{
              ...CMCommonStyles.label(themeMode),
              width: 50,
              textAlign: 'center',
            }}
          >
            L
          </Text>
        </View>
        <FlatList
          style={{ flex: 0, marginBottom: insets.bottom }}
          refreshing={refreshingStandings}
          onRefresh={() => {
            if (teams.length > 0) {
              loadStandings();
            }
          }}
          initialNumToRender={standings.length}
          data={standings}
          renderItem={({ item, separators }) => (
            <CMStandingCell
              standing={item}
              onPress={() => {
                // navigation.navigate(CMConstants.screenName.leagueDetails, {league: item})
              }}
            />
          )}
          ItemSeparatorComponent={({ highlighted }) => (
            <View style={{ height: 0 }} />
          )}
        />
      </View>
    );
  };

  const StatsTab = () => {
    return (
      <View
        style={{
          flex: 1,
          paddingHorizontal: CMConstants.space.small,
          backgroundColor: CMConstants.color.white,
        }}
      >
        
        
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 5,
          }}
        >
          <Text style={{ ...CMCommonStyles.label(themeMode), flex: 1 }}>
            Player
          </Text>
          <CMRipple
            containerStyle={styles.headItem}
            onPress={() => {
              setStatsIndex(0);
              const stats: { [name: string]: any }[] = Object.assign(
                [],
                playerStats,
              );
              stats.sort((stat1, stat2) => {
                return stat2.points - stat1.points;
              });
              setPlayerStats(stats);
              CMToast.makeText(toast, 'Stats sorted by points');
            }}
          >
            <Text
              style={{
                ...CMCommonStyles.label(themeMode),
                textDecorationLine: statsIndex == 0 ? 'underline' : 'none',
              }}
            >
              P
            </Text>
          </CMRipple>
          <CMRipple
            containerStyle={styles.headItem}
            onPress={() => {
              setStatsIndex(1);
              const stats: { [name: string]: any }[] = Object.assign(
                [],
                playerStats,
              );
              stats.sort((stat1, stat2) => {
                return stat2.assists - stat1.assists;
              });
              setPlayerStats(stats);
              CMToast.makeText(toast, 'Stats sorted by assists');
            }}
          >
            <Text
              style={{
                ...CMCommonStyles.label(themeMode),
                textDecorationLine: statsIndex == 1 ? 'underline' : 'none',
              }}
            >
              A
            </Text>
          </CMRipple>
          <CMRipple
            containerStyle={styles.headItem}
            onPress={() => {
              setStatsIndex(2);
              const stats: { [name: string]: any }[] = Object.assign(
                [],
                playerStats,
              );
              stats.sort((stat1, stat2) => {
                return stat2.rebounds - stat1.rebounds;
              });
              setPlayerStats(stats);
              CMToast.makeText(toast, 'Stats sorted by rebounds');
            }}
          >
            <Text
              style={{
                ...CMCommonStyles.label(themeMode),
                textDecorationLine: statsIndex == 2 ? 'underline' : 'none',
              }}
            >
              R
            </Text>
          </CMRipple>
          <CMRipple
            containerStyle={styles.headItem}
            onPress={() => {
              setStatsIndex(3);
              const stats: { [name: string]: any }[] = Object.assign(
                [],
                playerStats,
              );
              stats.sort((stat1, stat2) => {
                return stat2.blocks - stat1.blocks;
              });
              setPlayerStats(stats);
              CMToast.makeText(toast, 'Stats sorted by blocks');
            }}
          >
            <Text
              style={{
                ...CMCommonStyles.label(themeMode),
                textDecorationLine: statsIndex == 3 ? 'underline' : 'none',
              }}
            >
              B
            </Text>
          </CMRipple>
          <CMRipple
            containerStyle={styles.headItem}
            onPress={() => {
              setStatsIndex(4);
              const stats: { [name: string]: any }[] = Object.assign(
                [],
                playerStats,
              );
              stats.sort((stat1, stat2) => {
                return stat2.steals - stat1.steals;
              });
              setPlayerStats(stats);
              CMToast.makeText(toast, 'Stats sorted by steals');
            }}
          >
            <Text
              style={{
                ...CMCommonStyles.label(themeMode),
                textDecorationLine: statsIndex == 4 ? 'underline' : 'none',
              }}
            >
              S
            </Text>
          </CMRipple>
        </View>
        <FlatList
          style={{ flex: 0, marginBottom: insets.bottom }}
          refreshing={refreshingStats}
          onRefresh={() => {
            loadPlayerStats();
          }}
          initialNumToRender={playerStats.length}
          data={playerStats}
          renderItem={({ item, index, separators }) => (
            <CMPlayerStatCell
              playerStat={item}
              index={index}
              onPress={() => {
                // navigation.navigate(CMConstants.screenName.leagueDetails, {league: item})
              }}
            />
          )}
          ItemSeparatorComponent={({ highlighted }) => (
            <View style={{ height: 0 }} />
          )}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={CMCommonStyles.bodyMain(themeMode)}>
      <View style={styles.shortInfo}>
        <CMProfileImage radius={80} imgURL={league.avatar} />
        <View style={{ marginLeft: CMConstants.space.smallEx }}>
          <Text style={CMCommonStyles.title(themeMode)} numberOfLines={1}>
            {league.name}
          </Text>
          {(league.city || league.state || league.country) && (
            <Text style={CMCommonStyles.label(themeMode)} numberOfLines={1}>
              {[league.city, league.state, league.country].filter(Boolean).join(', ')}
            </Text>
          )}
          <View
            style={{
              flexDirection: 'row',
              marginTop: CMConstants.space.smallEx,
            }}
          >
           {console.log(league.instagramUrl)}
            {league.instagramUrl && (
              <CMRipple
                containerStyle={{
                  ...CMCommonStyles.circle(CMConstants.height.iconBig),
                  marginLeft: league.facebookUrl ? 5 : 0,
                }}
                onPress={() => openUrl(league.instagramUrl, 'Instagram')}
              >
                <Ionicons
                  name={'logo-instagram'}
                  size={CMConstants.height.iconBig}
                  color={CMConstants.color.black}
                />
              </CMRipple>
            )}
            <Text
              style={{
                ...CMCommonStyles.label(themeMode),
                marginLeft: CMConstants.space.normal,
              }}
              numberOfLines={1}
            >
              {league.teamsId.length}
              {league.teamsId.length >= 2 ? ' Teams' : ' Team'}
            </Text>
          </View>
        </View>
      </View>

      <Tab.Navigator
        screenOptions={{
          tabBarStyle: {
            backgroundColor: CMConstants.color.white,
          },
          tabBarIndicatorStyle: { backgroundColor: CMConstants.color.black },
          tabBarLabelStyle: {
            fontFamily: CMConstants.font.regular,
            fontSize: CMConstants.fontSize.normal,
            includeFontPadding: false,
          },
          tabBarActiveTintColor: CMConstants.color.black,
          tabBarInactiveTintColor: CMConstants.color.semiLightGrey,
        }}
      >
        <Tab.Screen name="Teams" component={TeamsTab} />
        <Tab.Screen name="Standings" component={StandingsTab} />
        <Tab.Screen name="Stats" component={StatsTab} />
      </Tab.Navigator>
    </SafeAreaView>
  );
};

const styles = {
  shortInfo: {
    padding: CMConstants.space.small,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    overflow: 'hidden',
  } as ViewStyle,
  headItem: {
    ...CMCommonStyles.circle(40),
    alignItems: 'center',
    justifyContent: 'center',
  } as ViewStyle,
};

export default CMLeagueDetailsScreen;

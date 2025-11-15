import React, { useState, useCallback, useEffect, useMemo } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CMNavigationProps from '../navigation/CMNavigationProps';
import CMCommonStyles from '../styles/CMCommonStyles';
import CMConstants from '../CMConstants';
import CMUtils from '../utils/CMUtils';
import CMRipple from '../components/CMRipple';
import CMProfileImage from '../components/CMProfileImage';

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
  player?: any;
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

const CMAllTopPlayersScreen = ({ navigation, route }: CMNavigationProps) => {
  const themeMode = CMConstants.themeMode.light;
  const insets = useSafeAreaInsets();

  const allPlayers: TopPlayer[] = route.params?.players || [];
  const timeframe: string = route.params?.timeframe || 'This Season';

  // Sort options
  type SortOption = 'Points' | 'Assists' | 'Rebounds' | 'Steals' | 'Blocks' | null;
  const [selectedSort, setSelectedSort] = useState<SortOption>(null);
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const sortOptions: SortOption[] = ['Points', 'Assists', 'Rebounds', 'Steals', 'Blocks'];

  const ITEMS_PER_PAGE = 10;
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Sort players based on selected option
  const sortedPlayers = useMemo(() => {
    if (!selectedSort) {
      // No sort selected, return original order
      return [...allPlayers];
    }

    const sorted = [...allPlayers];
    sorted.sort((a, b) => {
      let valueA = 0;
      let valueB = 0;

      switch (selectedSort) {
        case 'Points':
          valueA = a.averagePoints || 0;
          valueB = b.averagePoints || 0;
          break;
        case 'Assists':
          valueA = a.averageAssists || 0;
          valueB = b.averageAssists || 0;
          break;
        case 'Rebounds':
          valueA = a.averageRebounds || 0;
          valueB = b.averageRebounds || 0;
          break;
        case 'Steals':
          valueA = a.averageSteals || 0;
          valueB = b.averageSteals || 0;
          break;
        case 'Blocks':
          valueA = a.averageBlocks || 0;
          valueB = b.averageBlocks || 0;
          break;
      }

      return valueB - valueA; // Sort descending (highest first)
    });
    return sorted;
  }, [allPlayers, selectedSort]);

  // Reset displayed count when sort changes
  useEffect(() => {
    setDisplayedCount(ITEMS_PER_PAGE);
  }, [selectedSort]);

  const displayedPlayers = sortedPlayers.slice(0, displayedCount);
  const hasMore = displayedCount < sortedPlayers.length;

  useEffect(() => {
    console.log(`Initial load: Showing ${Math.min(ITEMS_PER_PAGE, allPlayers.length)} of ${allPlayers.length} players`);
  }, []);

  const loadMore = useCallback(() => {
    if (!hasMore || isLoadingMore) return;

    setIsLoadingMore(true);
    // Load next batch of 10 items
    setTimeout(() => {
      setDisplayedCount(prev => {
        const nextCount = Math.min(prev + ITEMS_PER_PAGE, sortedPlayers.length);
        console.log(`Loading more: ${prev} -> ${nextCount} (total: ${sortedPlayers.length})`);
        return nextCount;
      });
      setIsLoadingMore(false);
    }, 300);
  }, [hasMore, isLoadingMore, sortedPlayers.length]);

  const renderPlayerItem = ({ item }: { item: TopPlayer }) => {
    return (
      <View style={styles.playerCard}>
        <CMRipple
          containerStyle={[styles.topPlayerScoreRow, { paddingVertical: 10, alignItems: 'center' }]}
          onPress={() => {
            navigation.navigate(CMConstants.screenName.playerDetails, {
              player: item.player,
              team: item.team,
              league: item.league
            });
          }}
        >
          <View style={{ width: 10 }}></View>
          <CMProfileImage
            radius={50}
            style={[styles.topPlayerProfileImage]}
            imgURL={item.league?.avatar}
          />
          <View style={{ width: 5 }}></View>
          <CMProfileImage
            radius={35}
            style={styles.topPlayerProfileImage}
            imgURL={item.player?.avatar}
            isUser={true}
          />

          <View style={styles.topPlayerInfoContainer}>
            <Text style={styles.topPlayerName} numberOfLines={2}>
              {item.player?.name || 'Unknown Player'}
            </Text>

            <View style={styles.topPlayerTeamRow}>
              <CMProfileImage
                radius={20}
                imgURL={item.team?.avatar}
              />
              <View style={styles.topPlayerTeamInfo}>
                <Text style={styles.topPlayerTeamName} numberOfLines={1}>
                  {item.team?.name || 'Unknown Team'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.topPlayerStatsContainer}>
            <View>
              <Text style={styles.topPlayerStatTitle}>P</Text>
              <Text style={styles.topPlayerStatValue}>
                {Math.round(item.averagePoints)}
              </Text>
            </View>
            <View>
              <Text style={styles.topPlayerStatTitle}>A</Text>
              <Text style={styles.topPlayerStatValue}>
                {Math.round(item.averageAssists)}
              </Text>
            </View>
            <View>
              <Text style={styles.topPlayerStatTitle}>R</Text>
              <Text style={styles.topPlayerStatValue}>
                {Math.round(item.averageRebounds)}
              </Text>
            </View>
            <View>
              <Text style={styles.topPlayerStatTitle}>B</Text>
              <Text style={styles.topPlayerStatValue}>
                {Math.round(item.averageBlocks)}
              </Text>
            </View>
            <View>
              <Text style={styles.topPlayerStatTitle}>S</Text>
              <Text style={styles.topPlayerStatValue}>
                {Math.round(item.averageSteals)}
              </Text>
            </View>
          </View>
        </CMRipple>
      </View>
    );
  };

  const renderFooter = () => {
    if (!isLoadingMore) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={CMConstants.color.denim} />
      </View>
    );
  };

  return (
    <SafeAreaView style={CMCommonStyles.bodyMain(themeMode)}>
      <View
        style={{
          height: CMConstants.height.navBar * 0.6,
          justifyContent: 'center',
          alignItems: 'center',
          flexDirection: 'row',
          marginTop: CMUtils.isAndroid ? insets.top : 0,
          marginHorizontal: CMConstants.space.normal,
        }}
      >
        <Text style={styles.headerTitle}>Top Players - {timeframe}</Text>
      </View>

      {/* Sort Dropdown */}
      <View style={styles.sortContainer}>
        <View style={{ position: 'relative' }}>
          <TouchableOpacity
            style={styles.sortDropdown}
            onPress={() => setShowSortDropdown(!showSortDropdown)}
          >
            <Text style={[styles.sortDropdownText, !selectedSort && styles.sortDropdownPlaceholder]}>
              {selectedSort || 'Sort by'}
            </Text>
            <Ionicons
              name={showSortDropdown ? "chevron-up" : "chevron-down"}
              size={16}
              color={CMConstants.color.denim}
              style={{ marginLeft: 4 }}
            />
          </TouchableOpacity>

          {/* Dropdown Options */}
          {showSortDropdown && (
            <View style={styles.sortDropdownMenu}>
              {sortOptions.map((option, index) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.sortDropdownOption,
                    selectedSort === option && styles.sortDropdownOptionSelected,
                    index === sortOptions.length - 1 && { borderBottomWidth: 0 }
                  ]}
                  onPress={() => {
                    setSelectedSort(option);
                    setShowSortDropdown(false);
                  }}
                >
                  <Text style={[
                    styles.sortDropdownOptionText,
                    selectedSort === option && styles.sortDropdownOptionTextSelected
                  ]}>
                    {option}
                  </Text>
                  {selectedSort === option && (
                    <Ionicons
                      name="checkmark"
                      size={18}
                      color={CMConstants.color.denim}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>

      <FlatList
        data={displayedPlayers}
        renderItem={renderPlayerItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: CMConstants.space.normal }}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        onScroll={() => {
          if (showSortDropdown) {
            setShowSortDropdown(false);
          }
        }}
        scrollEventThrottle={16}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No players found</Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

const styles = {
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold' as const,
    color: CMConstants.color.black,
  },
  sortContainer: {
    paddingHorizontal: CMConstants.space.normal,
    paddingVertical: CMConstants.space.smallEx / 3,
    alignItems: 'flex-end' as const,
  },
  sortDropdown: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: CMConstants.color.lightGrey2,
    borderRadius: CMConstants.radius.small,
    borderWidth: 1,
    borderColor: CMConstants.color.lightGrey,
  },
  sortDropdownText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: CMConstants.color.denim,
  },
  sortDropdownPlaceholder: {
    color: CMConstants.color.grey,
    fontWeight: '500' as const,
  },
  sortDropdownMenu: {
    position: 'absolute' as const,
    top: 32,
    right: 0,
    backgroundColor: CMConstants.color.white,
    borderRadius: CMConstants.radius.small,
    borderWidth: 1,
    borderColor: CMConstants.color.lightGrey,
    minWidth: 150,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  sortDropdownOption: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: CMConstants.color.lightGrey,
  },
  sortDropdownOptionSelected: {
    backgroundColor: CMConstants.color.lightGrey2,
  },
  sortDropdownOptionText: {
    fontSize: 13,
    color: CMConstants.color.black,
    fontWeight: '500' as const,
  },
  sortDropdownOptionTextSelected: {
    color: CMConstants.color.denim,
    fontWeight: '600' as const,
  },
  playerCard: {
    marginBottom: CMConstants.space.smallEx,
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
  topPlayerProfileImage: {},
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
  loadingFooter: {
    paddingVertical: CMConstants.space.normal,
    alignItems: 'center' as const,
  },
  emptyContainer: {
    padding: CMConstants.space.normal,
    alignItems: 'center' as const,
  },
  emptyText: {
    fontSize: 14,
    color: CMConstants.color.grey,
  },
};

export default CMAllTopPlayersScreen;


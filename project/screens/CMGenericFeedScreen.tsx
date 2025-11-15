import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  FlatList,
  TextInput,
  Keyboard,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CMNavigationProps from '../navigation/CMNavigationProps';
import CMCommonStyles from '../styles/CMCommonStyles';
import CMConstants from '../CMConstants';
import CMGlobal from '../CMGlobal';
import CMFirebaseHelper from '../helper/CMFirebaseHelper';
import CMActivityCell from '../components/CMActivityCell';
import CMRipple from '../components/CMRipple';
import CMUtils from '../utils/CMUtils';
import CMLoadingDialog from '../dialog/CMLoadingDialog';
import CMPermissionHelper from '../helper/CMPermissionHelper';

interface CMGenericFeedScreenProps extends CMNavigationProps {
  // Customizable properties
  title?: string;
  dataSource?: 'activities' | 'matches' | 'events' | 'custom';
  searchFields?: string[];
  onItemPress?: (item: any) => void;
  renderItem?: (item: any) => React.ReactElement;
  loadData?: () => Promise<any[]>;
  showAddButton?: boolean;
  addButtonAction?: () => void;
}

const CMGenericFeedScreen = ({ 
  navigation, 
  route,
  title = 'Matches',
  dataSource = 'matches',
  searchFields = ['name', 'location'],
  onItemPress,
  renderItem,
  loadData,
  showAddButton = true,
  addButtonAction
}: CMGenericFeedScreenProps) => {
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const [items, setItems] = useState<{ [name: string]: any }[]>([]);
  const [filteredItems, setFilteredItems] = useState<{ [name: string]: any }[]>([]);
  const [matchPermissions, setMatchPermissions] = useState<{ [matchId: string]: boolean }>({});

  const themeMode = CMConstants.themeMode.light;

  // Get props from route params if available
  const routeTitle = route?.params?.title || title;
  const routeDataSource = route?.params?.dataSource || dataSource;
  const routeSearchFields = route?.params?.searchFields || searchFields;
  const routeOnItemPress = route?.params?.onItemPress || onItemPress;
  const routeRenderItem = route?.params?.renderItem || renderItem;
  const routeLoadData = route?.params?.loadData || loadData;
  const routeShowAddButton = route?.params?.showAddButton !== undefined ? route?.params?.showAddButton : showAddButton;
  const routeAddButtonAction = route?.params?.addButtonAction || addButtonAction;
  

  useEffect(() => {
    navigation.addListener('focus', () => {
      loadItems();
    });

    return () => {
      navigation.removeListener('focus');
    };
  }, []);

  useEffect(() => {
    filterItems();
  }, [searchText, items, isSearching]);

  const filterItems = () => {
    if (isSearching) {
      const word = searchText.toLowerCase();
      if (word.trim().length == 0) {
        setFilteredItems(items);
      } else {
        setFilteredItems(
          items.filter((item: { [name: string]: any }) => {
            return routeSearchFields.some((field: string) => {
              const fieldValue = item.data?.[field] || item[field];
              return fieldValue?.toLowerCase().includes(word);
            });
          }),
        );
      }
    } else {
      setFilteredItems(items);
    }
  };

  const sortAndSetItems = (items: { [name: string]: any }[]) => {
    items.sort(
      (item1: { [name: string]: any }, item2: { [name: string]: any }) => {
        const date1 = item1.data?.dateTime?.toDate?.() || item1.dateTime?.toDate?.() || new Date(0);
        const date2 = item2.data?.dateTime?.toDate?.() || item2.dateTime?.toDate?.() || new Date(0);
        return date1 > date2 ? -1 : 1;
      },
    );
    setItems(items);
  };

  const loadItems = async () => {
    if (routeLoadData) {
      // Use custom data loader
      setRefreshing(true);
      if (!refreshing) {
        setLoading(true);
      }
      try {
        const data = await routeLoadData();
        sortAndSetItems(data);
      } catch (error) {
        console.error('Error loading custom data:', error);
      } finally {
        setRefreshing(false);
        setLoading(false);
      }
      return;
    }

    // Default data loading based on dataSource
    let items: { [name: string]: any }[] = [];
    
    // Show loading dialog for initial load (not for refresh)
    if (!refreshing) {
      setLoading(true);
    }
    
    switch (routeDataSource) {
      case 'activities':
        await loadActivities(items);
        break;
      case 'matches':
        await loadMatches(items);
        break;
      case 'events':
        await loadEvents(items);
        break;
      default:
        console.log('Unknown data source:', routeDataSource);
        setRefreshing(false);
        setLoading(false);
    }
  };

  const loadActivities = async (items: { [name: string]: any }[]) => {
    const loadMatches = async () => {
      CMFirebaseHelper.getLeagues(
        async (response: { [name: string]: any }) => {
          if (response.isSuccess) {
            let leagueIds = response.value.map(
              (league: { [name: string]: any }) => league.id,
            );
            CMFirebaseHelper.getMatchesOfLeagues(
              leagueIds,
              async (response: { [name: string]: any }) => {
                setRefreshing(false);
                setLoading(false);
                if (response.isSuccess) {
                  response.value.forEach((item: { [name: string]: any }) => {
                    items.push({
                      type: CMConstants.activityType.match,
                      data: item,
                    });
                  });
                  
                  // Check permissions for all matches
                  const permissions: { [matchId: string]: boolean } = {};
                  for (const match of response.value) {
                    if (match.id) {
                      permissions[match.id] = await CMPermissionHelper.canEditMatch(match.id, match);
                    }
                  }
                  setMatchPermissions(prev => ({ ...prev, ...permissions }));
                }
                sortAndSetItems(items);
              },
            );
          } else {
            setRefreshing(false);
            setLoading(false);
            sortAndSetItems(items);
          }
        },
      );
    };

    setRefreshing(true);
    CMFirebaseHelper.getEvents(
      (response: { [name: string]: any }) => {
        if (response.isSuccess) {
          response.value.forEach((item: { [name: string]: any }) => {
            items.push({
              type: CMConstants.activityType.event,
              data: item,
            });
          });
        }
        loadMatches();
      },
    );
  };

  const loadMatches = async (items: { [name: string]: any }[]) => {
    setRefreshing(true);
    CMFirebaseHelper.getLeagues(
      async (response: { [name: string]: any }) => {
        if (response.isSuccess) {
          let leagueIds = response.value.map(
            (league: { [name: string]: any }) => league.id,
          );
          CMFirebaseHelper.getMatchesOfLeagues(
            leagueIds,
            async (response: { [name: string]: any }) => {
              setRefreshing(false);
              setLoading(false);
              if (response.isSuccess) {
                response.value.forEach((item: { [name: string]: any }) => {
                  items.push({
                    type: CMConstants.activityType.match,
                    data: item,
                  });
                });
                
                // Check permissions for all matches
                const permissions: { [matchId: string]: boolean } = {};
                for (const match of response.value) {
                  if (match.id) {
                    permissions[match.id] = await CMPermissionHelper.canEditMatch(match.id, match);
                  }
                }
                setMatchPermissions(permissions);
              }
              sortAndSetItems(items);
            },
          );
        } else {
          setRefreshing(false);
          setLoading(false);
          sortAndSetItems(items);
        }
      },
    );
  };

  const loadEvents = async (items: { [name: string]: any }[]) => {
    setRefreshing(true);
    CMFirebaseHelper.getEvents(
      (response: { [name: string]: any }) => {
        setRefreshing(false);
        setLoading(false);
        if (response.isSuccess) {
          response.value.forEach((item: { [name: string]: any }) => {
            items.push({
              type: CMConstants.activityType.event,
              data: item,
            });
          });
        }
        sortAndSetItems(items);
      },
    );
  };

  const handleItemPress = (item: any) => {
    if (routeOnItemPress) {
      routeOnItemPress(item);
    } else {
      // Default behavior similar to CMActivityFeedScreen
      console.log('Activity pressed:', item);
      console.log(item.data);
      
      // Check if this looks like a match (has teamAId and teamBId)
      const hasMatchStructure = item.data.teamAId && item.data.teamBId;

      if (
        item.type === CMConstants.activityType.match ||
        hasMatchStructure
      ) {
        console.log('Navigating to scoreboard for match:', item.data);
        navigation.navigate(CMConstants.screenName.scoreboard, {
          match: item.data,
        });
      } else if (item.type === CMConstants.activityType.event) {
        console.log("Event pressed - checking if it's actually a match...");

        // If it's an event but has match structure, treat it as a match
        if (hasMatchStructure) {
          console.log('Event has match structure, navigating to scoreboard');
          navigation.navigate(CMConstants.screenName.scoreboard, {
            match: item.data,
          });
        } else {
          console.log('Event pressed - no navigation implemented yet');
          // TODO: Implement event navigation
        }
      }
    }
  };

  const handleAddButtonPress = () => {
    if (routeAddButtonAction) {
      routeAddButtonAction();
    } else {
      // Default behavior - navigate to edit match for matches feed
      if (routeDataSource === 'matches') {
        navigation.navigate(CMConstants.screenName.editMatch, {
          match: {},
          callback: () => {
            loadItems();
          },
        });
      } else {
        // Fallback to edit event for other data sources
        navigation.navigate(CMConstants.screenName.editEvent, {
          event: {},
          callback: () => {
            loadItems();
          },
        });
      }
    }
  };

  const handleEditMatch = (item: any) => {
    navigation.navigate(CMConstants.screenName.editMatch, {
      match: item.data,
      isEdit: true,
      callback: () => {
        loadItems();
      },
    });
  };

  const handleDeleteMatch = (item: any) => {
    const matchName = item.data?.name || 'this match';
    
    Alert.alert(
      'Delete Match',
      `Are you sure you want to delete "${matchName}"? This will permanently delete the match and ALL associated data. This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            deleteMatch(item);
          },
        },
      ]
    );
  };

  const deleteMatch = (item: any) => {
    const matchId = item.data?.id;
    
    if (!matchId) {
      Alert.alert('Error', 'Match ID not found');
      return;
    }

    setRefreshing(true);
    
    CMFirebaseHelper.deleteMatchWithAssociatedData(
      matchId,
      (response: { [name: string]: any }) => {
        setRefreshing(false);
        
        if (response.isSuccess) {
          Alert.alert('Success', 'Match and all associated data deleted successfully!', [
            {
              text: 'OK',
              onPress: () => {
                // Remove the deleted item from the local state
                const updatedItems = items.filter((matchItem: any) => matchItem.data.id !== matchId);
                setItems(updatedItems);
                setFilteredItems(updatedItems);
              },
            },
          ]);
        } else {
          Alert.alert('Error', response.value || 'Failed to delete match and associated data');
        }
      }
    );
  };

  const renderDefaultItem = ({ item }: { item: any }) => {
    if (routeRenderItem) {
      return routeRenderItem(item);
    }

    // Use CMActivityCell with edit/delete actions for matches
    if (routeDataSource === 'matches') {
      const matchId = item.data?.id || item.id;
      const canEdit = matchPermissions[matchId] ?? false;
      
      return (
        <View style={styles.matchItemContainer}>
          <CMActivityCell
            activity={item}
            onPress={() => handleItemPress(item)}
          />
          {canEdit && (
            <View style={styles.actionButtons}>
              <CMRipple
                containerStyle={styles.actionButton}
                onPress={() => handleEditMatch(item)}
              >
                <Ionicons
                  name={'create-outline'}
                  size={16}
                  color={CMConstants.color.white}
                />
              </CMRipple>
              <CMRipple
                containerStyle={styles.actionButton}
                onPress={() => handleDeleteMatch(item)}
              >
                <Ionicons
                  name={'trash-outline'}
                  size={16}
                  color={CMConstants.color.white}
                />
              </CMRipple>
            </View>
          )}
        </View>
      );
    }

    // Default CMActivityCell for other data sources
    return (
      <CMActivityCell
        activity={item}
        onPress={() => handleItemPress(item)}
      />
    );
  };

  return (
    <SafeAreaView style={CMCommonStyles.bodyMain(themeMode)}>
      <View style={{ flex: 1, marginHorizontal: CMConstants.space.normal }}>
        <View
          style={{
            height: CMConstants.height.navBar,
            justifyContent: 'center',
            alignItems: 'center',
            flexDirection: 'row',
            marginTop: CMUtils.isAndroid ? insets.top : 0,
          }}
        >
          {!isSearching ? (
            <>
              <Text style={CMCommonStyles.title(themeMode)}>{routeTitle}</Text>
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

        <View style={{ flex: 1 }}>
          <FlatList
            style={{ flex: 0, marginBottom: insets.bottom }}
            refreshing={refreshing}
            onRefresh={() => loadItems()}
            initialNumToRender={filteredItems.length}
            data={filteredItems}
            renderItem={renderDefaultItem}
            ItemSeparatorComponent={({ highlighted }) => (
              <View style={{ height: CMConstants.space.smallEx }} />
            )}
            keyExtractor={(item, index) => item.id || index.toString()}
          />
        </View>

        {routeShowAddButton && (
          <CMRipple
            containerStyle={{
              ...CMCommonStyles.circle(60),
              position: 'absolute',
              justifyContent: 'center',
              alignItems: 'center',
              right: CMConstants.space.smallEx,
              bottom: CMConstants.space.normal,
              backgroundColor: CMConstants.color.grey,
            }}
            onPress={handleAddButtonPress}
          >
            <Ionicons
              name={'add-outline'}
              size={CMConstants.height.iconBigEx}
              color={CMConstants.color.white}
            />
          </CMRipple>
        )}
      </View>
      
      <CMLoadingDialog visible={loading} />
    </SafeAreaView>
  );
};

const styles = {
  matchItemContainer: {
    position: 'relative' as const,
  },
  actionButtons: {
    position: 'absolute' as const,
    top: CMConstants.space.smallEx,
    right: CMConstants.space.smallEx,
    flexDirection: 'row' as const,
    backgroundColor: CMConstants.color.black,
    borderRadius: CMConstants.radius.normal,
    padding: 4,
  },
  actionButton: {
    marginHorizontal: 2,
    padding: 8,
    minWidth: 32,
    minHeight: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
};

export default CMGenericFeedScreen;

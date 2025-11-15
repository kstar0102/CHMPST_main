import { createStackNavigator } from '@react-navigation/stack';
import React from 'react';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CMConstants from '../CMConstants';
import CMMainScreen from '../screens/CMMainScreen';
import CMNavigationStyle from './CMNavigationStyle';
import CMCommonStyles from '../styles/CMCommonStyles';
import CMRipple from '../components/CMRipple';
import CMEditProfileScreen from '../screens/CMEditProfileScreen';
import CMEditTeamScreen from '../screens/CMEditTeamScreen';
import CMEditLeagueScreen from '../screens/CMEditLeagueScreen';
import CMEditMatchScreen from '../screens/CMEditMatchScreen';
import CMChangePwdScreen from '../screens/CMChangePwdScreen';
import CMLeagueDetailsScreen from '../screens/CMLeagueDetailsScreen';
import CMPlayersScreen from '../screens/CMPlayersScreen';
import CMPlayerDetailsScreen from '../screens/CMPlayerDetailsScreen';
import CMPlayersOfTeamScreen from '../screens/CMPlayersOfTeamScreen';
import CMEditPlayerScreen from '../screens/CMEditPlayerScreen';
import CMEditPlayerStatsScreen from '../screens/CMEditPlayerStatsScreen';
import CMEditEventScreen from '../screens/CMEditEventScreen';
import CMMatchPlayersStatsScreen from '../screens/CMMatchPlayersStatsScreen';
import CMScoreboardScreen from '../screens/CMScoreboardScreen';
import CMTeamManagementScreen from '../screens/CMTeamManagement';
import CMTeamManagementTabScreen from '../screens/CMTeamManagementTabScreen';
import CMAllTopPlayersScreen from '../screens/CMAllTopPlayersScreen';

const Stack = createStackNavigator();

const CMCoachStackNavigatorRoutes = (props: any) => {
  const themeMode = CMConstants.themeMode.light;
  // const [themeMode, setThemeMode] = useGlobalState('themeMode')

  return (
    <Stack.Navigator initialRouteName={CMConstants.screenName.main}>
      <Stack.Screen
        name={CMConstants.screenName.main}
        component={CMMainScreen}
        options={{
          ...CMNavigationStyle.header(themeMode),
          title: 'Main',
          headerBackTitle: '',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name={CMConstants.screenName.editProfile}
        component={CMEditProfileScreen}
        options={{
          ...CMNavigationStyle.header(themeMode),
          title: 'Edit Profile',
          headerBackTitle: '',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name={CMConstants.screenName.changePwd}
        component={CMChangePwdScreen}
        options={{
          ...CMNavigationStyle.header(themeMode),
          title: 'Change Password',
          headerBackTitle: '',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name={CMConstants.screenName.editTeam}
        component={CMEditTeamScreen}
        options={{
          ...CMNavigationStyle.header(themeMode),
          title: 'Edit Team',
          headerBackTitle: '',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name={CMConstants.screenName.editLeague}
        component={CMEditLeagueScreen}
        options={{
          ...CMNavigationStyle.header(themeMode),
          title: 'Edit League',
          headerBackTitle: '',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name={CMConstants.screenName.leagueDetails}
        component={CMLeagueDetailsScreen}
        options={({ navigation, route }) => ({
          ...CMNavigationStyle.header(themeMode),
          title: 'League',
          headerBackTitle: '',
          headerShown: true,
          headerRight: () => (
            <CMRipple
              containerStyle={{
                ...CMCommonStyles.circle(CMConstants.height.iconBig),
                marginRight: CMConstants.space.normal,
                justifyContent: 'center',
                alignItems: 'center',
              }}
              onPress={() => {
                if (route.params && 'league' in route.params) {
                  navigation.navigate(CMConstants.screenName.editMatch, {
                    isEdit: false,
                    league: route.params.league,
                  });
                }
              }}
            >
              <Ionicons
                name="add-outline"
                size={CMConstants.height.iconBig}
                color={CMConstants.color.black}
              />
            </CMRipple>
          ),
        })}
      />
      <Stack.Screen
        name={CMConstants.screenName.players}
        component={CMPlayersScreen}
        options={{
          ...CMNavigationStyle.header(themeMode),
          title: 'Players',
          headerBackTitle: '',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name={CMConstants.screenName.playerDetails}
        component={CMPlayerDetailsScreen}
        options={{
          ...CMNavigationStyle.header(themeMode),
          title: 'Player Details',
          headerBackTitle: '',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="AllTopPlayers"
        component={CMAllTopPlayersScreen}
        options={{
          ...CMNavigationStyle.header(themeMode),
          title: 'All Top Players',
          headerBackTitle: '',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name={CMConstants.screenName.playersOfTeam}
        component={CMPlayersOfTeamScreen}
        options={{
          ...CMNavigationStyle.header(themeMode),
          title: 'Players',
          headerBackTitle: '',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name={CMConstants.screenName.editPlayer}
        component={CMEditPlayerScreen}
        options={{
          ...CMNavigationStyle.header(themeMode),
          title: 'Edit Player',
          headerBackTitle: '',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name={CMConstants.screenName.editPlayerStats}
        component={CMEditPlayerStatsScreen}
        options={{
          ...CMNavigationStyle.header(themeMode),
          title: 'Add Player Stats',
          headerBackTitle: '',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name={CMConstants.screenName.editEvent}
        component={CMEditEventScreen}
        options={{
          ...CMNavigationStyle.header(themeMode),
          title: 'Edit Event',
          headerBackTitle: '',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name={CMConstants.screenName.editMatch}
        component={CMEditMatchScreen}
        options={{
          ...CMNavigationStyle.header(themeMode),
          title: 'Edit Match',
          headerBackTitle: '',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name={CMConstants.screenName.matchPlayersStats}
        component={CMMatchPlayersStatsScreen}
        options={{
          ...CMNavigationStyle.header(themeMode),
          title: 'Match Player Stats',
          headerBackTitle: '',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name={CMConstants.screenName.scoreboard}
        component={CMScoreboardScreen}
        options={{
          ...CMNavigationStyle.header(themeMode),
          title: 'Scoreboard',
          headerBackTitle: '',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name={CMConstants.screenName.teamManagement}
        component={CMTeamManagementScreen}
        options={{
          ...CMNavigationStyle.header(themeMode),
          title: 'Team Management',
          headerBackTitle: '',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name={CMConstants.screenName.teamManagementTab}
        component={CMTeamManagementTabScreen}
        options={{
          ...CMNavigationStyle.header(themeMode),
          title: 'Team Management',
          headerBackTitle: '',
          headerShown: true,
        }}
      />
    </Stack.Navigator>
  );
};

export default CMCoachStackNavigatorRoutes;

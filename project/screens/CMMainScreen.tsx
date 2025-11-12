import React, {useEffect} from 'react'
import {SafeAreaView} from 'react-native-safe-area-context'
import CMNavigationProps from '../navigation/CMNavigationProps'
import CMCommonStyles from '../styles/CMCommonStyles'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import CMConstants from '../CMConstants'
import CMTabBar from '../components/CMTabBar'
import CMHomeScreen from './CMHomeScreen'
import CMActivityFeedScreen from './CMActivityFeedScreen'
import CMTeamManagementScreen from './CMTeamManagement'
import CMLeagueScreen from './CMLeagueScreen'
import CMSettingsScreen from './CMSettingsScreen'
import CMTeamManagementTabScreen from './CMTeamManagementTabScreen'
import CMGenericFeedScreen from './CMGenericFeedScreen'

const CMMainScreen = ({navigation, route}: CMNavigationProps) => {
	const themeMode = CMConstants.themeMode.light

	const Tab = createBottomTabNavigator()

	return (
		<SafeAreaView
			style={CMCommonStyles.bodyMain(themeMode)}
			edges={['right', 'left']}
		>
			<CMTabBar Tab={Tab}>
				<Tab.Screen name="Home" component={CMHomeScreen} />
				{/* <Tab.Screen name="Activity Feed" component={CMActivityFeedScreen} /> */}
				<Tab.Screen name="Matches" component={CMGenericFeedScreen} />

				{/* <Tab.Screen name="Team Management" component={CMTeamManagementScreen} /> */}
				{/* <Tab.Screen name="Team Management" component={CMTeamManagementTabScreen} /> */}

				<Tab.Screen name="League" component={CMLeagueScreen} />
				<Tab.Screen name="Settings" component={CMSettingsScreen} />
			</CMTabBar>
		</SafeAreaView>
	)
}

const styles = {
    
}

export default CMMainScreen
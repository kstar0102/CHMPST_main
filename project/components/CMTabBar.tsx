import React from 'react'
import Ionicons from 'react-native-vector-icons/Ionicons'
import CMConstants from '../CMConstants'
import CMUtils from '../utils/CMUtils'

interface ScreenOptionsProps {
	route: any
}

interface TabBarIconProps {
	focused: boolean
	color: string
	size: number
}

const CMTabBar = (props: any) => {
	const {Tab} = props

    const themeMode = CMConstants.themeMode.light

	Ionicons.loadFont()
	const tabIconNames: {[name: string]: string} = {
		Home: 'home',
		Matches: 'document-text', //ios-albums
		// 'Team Management': 'people',
		// 'Team Management': 'people',
        League: 'basketball',
		Settings: 'settings'
	}

	return (
		<Tab.Navigator
			contentInsetAdjustmentBehavior="never"
			screenOptions={({route}: ScreenOptionsProps) => ({
				tabBarIcon: ({focused, color, size}: TabBarIconProps) => {
					return (
						<Ionicons
							name={tabIconNames[route.name]}
							size={size}
							color={color}
						/>
					)
				},
				tabBarActiveTintColor: CMConstants.color.black,
				tabBarInactiveTintColor: CMUtils.colorWith(themeMode, CMConstants.color.semiLightGrey, CMConstants.color.semiLightGrey),
				tabBarActiveBackgroundColor: CMUtils.colorWith(themeMode, CMConstants.color.white, CMConstants.color.darkGrey),
				tabBarInactiveBackgroundColor: CMUtils.colorWith(themeMode, CMConstants.color.white, CMConstants.color.darkGrey),
				headerShown: false,
				tabBarStyle: {
					backgroundColor: CMUtils.colorWith(themeMode, CMConstants.color.white, CMConstants.color.darkGrey),
					borderTopColor: CMUtils.colorWith(themeMode, CMConstants.color.lightGrey, CMConstants.color.grey)
				}
			})}
		>
			{props.children}
		</Tab.Navigator>
	)
}

export default CMTabBar

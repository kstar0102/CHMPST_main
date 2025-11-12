import React, {useState, useEffect} from 'react'
import {SafeAreaView, View, ViewStyle, Text, ScrollView, TextStyle} from 'react-native'
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import {useToast} from 'react-native-toast-notifications'
import CMNavigationProps from '../navigation/CMNavigationProps'
import CMCommonStyles from '../styles/CMCommonStyles'
import CMConstants from '../CMConstants'
import CMUtils from '../utils/CMUtils';
import CMProfileImage from '../components/CMProfileImage';

const CMPlayerDetailsScreen = ({navigation, route}: CMNavigationProps) => {
	const insets = useSafeAreaInsets()
	const toast = useToast()

	const themeMode = CMConstants.themeMode.light
	const Tab = createMaterialTopTabNavigator()

	const player = route.params.player

	useEffect(() => {
		navigation.setOptions({title: 'Player Details'})
	}, [])

	return (
		<SafeAreaView style={CMCommonStyles.bodyMain(themeMode)}>
			<View style={{...CMCommonStyles.body, flex: 1, marginBottom: insets.bottom}}>
				<View
					style={styles.shortInfo}
				>
					<CMProfileImage
						radius={80}
						imgURL={player.avatar || ''}
					/>
					<View
						style={{marginLeft: CMConstants.space.smallEx}}
					>
						<Text
							style={CMCommonStyles.title(themeMode)}
							numberOfLines={1}
						>
							{player.name || 'Unknown Player'}
						</Text>
					</View>
				</View>
				<View>
					<View
						style={{flexDirection: 'row'}}
					>
						<Text style={styles.label(themeMode)}>Birthday</Text>
						<Text style={styles.label(themeMode)}>Height</Text>
						<Text style={styles.label(themeMode)}>Weight</Text>
					</View>
					<View
						style={{flexDirection: 'row'}}
					>
						<Text style={styles.value(themeMode)}>{player.birthDate ? CMUtils.strSimpleDate(player.birthDate.toDate()) : 'N/A'}</Text>
						<Text style={styles.value(themeMode)}>{player.height || 'N/A'}</Text>
						<Text style={styles.value(themeMode)}>{player.weight || 'N/A'}</Text>
					</View>
				</View>
				<View style={{marginTop: CMConstants.space.smallEx}}>
					<View
						style={{flexDirection: 'row'}}
					>
						<Text style={styles.label(themeMode)}>Jersey number</Text>
						<Text style={styles.label(themeMode)}>Points per game</Text>
						<Text style={styles.label(themeMode)}>Position</Text>
					</View>
					<View
						style={{flexDirection: 'row'}}
					>
						<Text style={styles.value(themeMode)}>{player.number || 'N/A'}</Text>
						<Text style={styles.value(themeMode)}>-</Text>
						<Text style={styles.value(themeMode)}>{player.position || 'N/A'}</Text>
					</View>
				</View>
				<ScrollView
					style={{flex: 1}}
					nestedScrollEnabled={true}
				>
				</ScrollView>
			</View>
		</SafeAreaView>
	)
}

const styles = {
	shortInfo: {
		padding: CMConstants.space.small,
		alignItems: 'center',
		justifyContent: 'center',
		flexDirection: 'row',
		overflow: 'hidden'
	} as ViewStyle,
	label: (themeMode: string): TextStyle => ({
		...CMCommonStyles.textSmall(themeMode),
		flex: 1
	}),
	value: (themeMode: string): TextStyle => ({
		...CMCommonStyles.textNormalSemiBold(themeMode),
		flex: 1
	}),
}

export default CMPlayerDetailsScreen
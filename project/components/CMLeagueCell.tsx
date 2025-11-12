import React from 'react'
import { View, StyleSheet, Text } from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import CMConstants from '../CMConstants'
import CMRipple from './CMRipple'
import CMCommonStyles from '../styles/CMCommonStyles'
import CMProfileImage from './CMProfileImage'

const CMLeagueCell = (props: any) => {
	const themeMode = CMConstants.themeMode.light

	const { league = {} } = props

	return (
		<View style={styles.cell}>
			<CMRipple
				containerStyle={styles.contentContainer}
				onPress={() => {props.onPress()}}
			>
				<CMProfileImage
					radius={80}
					imgURL={league.avatar}
				/>
				<View
					style={{flex: 1, marginLeft: CMConstants.space.smallEx}}
				>
					<Text
						style={CMCommonStyles.title(themeMode)}
						numberOfLines={2}
					>
						{league.name}
					</Text>
					<Text
						style={{...CMCommonStyles.label(themeMode), marginTop: 5}}
						numberOfLines={1}
					>
						{league?.teamsId?.length ?? 0}{league?.teamsId?.length >= 2 ? ' Teams' : ' Team'}
					</Text>
					{(league.city || league.state || league.country) && (
						<Text
							style={{...CMCommonStyles.textSmallEx(themeMode), marginTop: 2}}
							numberOfLines={1}
						>
							{[league.city, league.state, league.country].filter(Boolean).join(', ')}
						</Text>
					)}
				</View>
			</CMRipple>
			
			<View style={styles.iconsContainer}>
				<CMRipple
					containerStyle={styles.iconButton}
					onPress={() => {
						if (props.onEdit) {
							props.onEdit(league)
						}
					}}
				>
					<Ionicons
						name="create-outline"
						size={CMConstants.height.icon}
						color={CMConstants.color.denim}
					/>
				</CMRipple>
				
				<CMRipple
					containerStyle={[styles.iconButton, {marginLeft: CMConstants.space.smallEx}]}
					onPress={() => {
						if (props.onDelete) {
							props.onDelete(league)
						}
					}}
				>
					<Ionicons
						name="trash-outline"
						size={CMConstants.height.icon}
						color={CMConstants.color.red}
					/>
				</CMRipple>
			</View>
		</View>
	)
}

const styles = StyleSheet.create({
	cell: {
		padding: CMConstants.space.smallEx,
		backgroundColor: CMConstants.color.lightGrey1,
		borderWidth: 1,
		borderRadius: CMConstants.radius.normal,
		borderColor: CMConstants.color.lightGrey,
		overflow: 'hidden'
	},
	contentContainer: {
		flexDirection: 'row',
		alignItems: 'center',
	},
	iconsContainer: {
		flexDirection: 'row',
		alignItems: 'center',
		justifyContent: 'flex-end'
	},
	iconButton: {
		width: CMConstants.height.iconBig,
		height: CMConstants.height.iconBig,
		justifyContent: 'center',
		alignItems: 'center',
		borderRadius: CMConstants.radius.small,
		backgroundColor: CMConstants.color.white
	}
})

export default CMLeagueCell
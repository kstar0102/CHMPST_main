import React from 'react'
import { View, StyleSheet, Text } from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import CMConstants from '../CMConstants'
import CMRipple from './CMRipple'
import CMCommonStyles from '../styles/CMCommonStyles'
import CMProfileImage from './CMProfileImage'

const CMTeamCell = (props: any) => {
	const themeMode = CMConstants.themeMode.light

	const { team = {} } = props

	return (
		<View style={styles.cell}>
			{/* Team Details Section */}
			<CMRipple
				containerStyle={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}
				onPress={() => {props.onPress()}}
			>
				<CMProfileImage
					radius={80}
					imgURL={team.avatar}
				/>
				<View
					style={{flex: 1, marginLeft: CMConstants.space.smallEx}}
				>
					<Text
						style={CMCommonStyles.title(themeMode)}
						numberOfLines={1}
					>
						{team.name}
					</Text>
				</View>
			</CMRipple>
			
			{/* Default chevron if no action buttons */}
			{!props.onView && !props.onEdit && !props.onDelete && (
				<Ionicons
					name={'chevron-forward-outline'}
					size={CMConstants.height.icon}
					color={CMConstants.color.black}
				/>
			)}
			
			{/* Action Icons - View, Edit and Delete (if callbacks provided) - Bottom Right */}
			{(props.onView || props.onEdit || props.onDelete) && (
				<View style={styles.iconsContainer}>
					{props.onView && (
						<CMRipple
							containerStyle={styles.iconButton}
							onPress={() => {
								if (props.onView) {
									props.onView(team)
								}
							}}
						>
							<Ionicons
								name="eye-outline"
								size={CMConstants.height.icon}
								color={CMConstants.color.grey}
							/>
						</CMRipple>
					)}
					
					{props.onEdit && (
						<CMRipple
							containerStyle={[styles.iconButton, {marginLeft: CMConstants.space.smallEx}]}
							onPress={() => {
								if (props.onEdit) {
									props.onEdit(team)
								}
							}}
						>
							<Ionicons
								name="create-outline"
								size={CMConstants.height.icon}
								color={CMConstants.color.denim}
							/>
						</CMRipple>
					)}
					
					{props.onDelete && (
						<CMRipple
							containerStyle={[styles.iconButton, {marginLeft: CMConstants.space.smallEx}]}
							onPress={() => {
								if (props.onDelete) {
									props.onDelete(team)
								}
							}}
						>
							<Ionicons
								name="trash-outline"
								size={CMConstants.height.icon}
								color={CMConstants.color.red}
							/>
						</CMRipple>
					)}
				</View>
			)}
		</View>
	)
}

const styles = StyleSheet.create({
	cell: {
		padding: CMConstants.space.smallEx,
		alignItems: 'center',
		flexDirection: 'row',
		backgroundColor: CMConstants.color.lightGrey1,
		borderWidth: 1,
		borderRadius: CMConstants.radius.normal,
		borderColor: CMConstants.color.lightGrey,
		overflow: 'hidden',
		position: 'relative'
	},
	iconsContainer: {
		position: 'absolute',
		bottom: CMConstants.space.smallEx,
		right: CMConstants.space.smallEx,
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

export default CMTeamCell
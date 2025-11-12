import React from 'react'
import { View, StyleSheet, Text } from 'react-native'
import Ionicons from 'react-native-vector-icons/Ionicons'
import CMConstants from '../CMConstants'
import CMRipple from './CMRipple'
import CMCommonStyles from '../styles/CMCommonStyles'
import CMProfileImage from './CMProfileImage'

const CMPlayerCell = (props: any) => {
	const themeMode = CMConstants.themeMode.light

	const { player = {} } = props
	
	// Debug logging
	console.log('CMPlayerCell props:', {
		hasOnEdit: !!props.onEdit,
		hasOnDelete: !!props.onDelete,
		playerName: player.name,
		onEditType: typeof props.onEdit,
		onDeleteType: typeof props.onDelete
	})

	return (
		<View style={styles.cell}>
			{/* Player Details Row */}
			<CMRipple
				containerStyle={styles.playerDetailsRow}
				onPress={() => {props.onPress()}}
			>
				<CMProfileImage
					radius={80}
					imgURL={player.avatar}
				/>
				<View
					style={{flex: 1, marginLeft: CMConstants.space.smallEx}}
				>
					<Text
						style={CMCommonStyles.title(themeMode)}
						numberOfLines={1}
					>
						{player.name}
					</Text>
				</View>
				
				{/* Default chevron if no action buttons */}
				{!props.onEdit && !props.onDelete && (
					<Ionicons
						name={'chevron-forward-outline'}
						size={CMConstants.height.icon}
						color={CMConstants.color.black}
					/>
				)}
			</CMRipple>
			
			{/* Action Icons - Edit and Delete (if callbacks provided) */}
			{(props.onEdit || props.onDelete) && (
			<View style={styles.iconsContainer}>
				<CMRipple
					containerStyle={styles.iconButton}
					onPress={() => {
						console.log('Edit button pressed for:', player.name)
						console.log('props.onEdit exists:', !!props.onEdit)
						console.log('props.onEdit type:', typeof props.onEdit)
						if (props.onEdit) {
							console.log('Calling props.onEdit (no parameters needed)')
							try {
								props.onEdit()
								console.log('props.onEdit called successfully')
							} catch (error) {
								console.log('Error calling props.onEdit:', error)
							}
						} else {
							console.log('props.onEdit is not available')
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
						console.log('Delete button pressed for:', player.name)
						console.log('props.onDelete exists:', !!props.onDelete)
						console.log('props.onDelete type:', typeof props.onDelete)
						if (props.onDelete) {
							console.log('Calling props.onDelete (no parameters needed)')
							try {
								props.onDelete()
								console.log('props.onDelete called successfully')
							} catch (error) {
								console.log('Error calling props.onDelete:', error)
							}
						} else {
							console.log('props.onDelete is not available')
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
	playerDetailsRow: {
		flexDirection: 'row',
		alignItems: 'center'
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

export default CMPlayerCell